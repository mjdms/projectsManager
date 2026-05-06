import { chromium } from "playwright"
import { calculateLeadScore, LeadData } from "./scoring"

function generateCoordinates(lat: number, lng: number, radius: number, mode: string) {
  if (mode === "Standard" || !mode) return [{ lat, lng }];
  
  const coords = [];
  const offset = radius / 111.32; // rough lat conversion 1 degree ~ 111.32km
  const lngOffset = offset / Math.cos(lat * (Math.PI / 180));
  
  if (mode === "Grid") {
    // 3x3 Grid
    const steps = [-0.66, 0, 0.66];
    for(const dx of steps) {
      for(const dy of steps) {
        coords.push({ lat: lat + dx * offset, lng: lng + dy * lngOffset });
      }
    }
  } else if (mode === "Spiral") {
    // Center, then 4 points, then 8 points
    coords.push({ lat, lng });
    // First ring (radius/2)
    for(let i=0; i<4; i++) {
      const angle = (i * Math.PI) / 2;
      coords.push({ lat: lat + (offset/2)*Math.sin(angle), lng: lng + (lngOffset/2)*Math.cos(angle) });
    }
    // Second ring (radius)
    for(let i=0; i<8; i++) {
      const angle = (i * Math.PI) / 4;
      coords.push({ lat: lat + offset*Math.sin(angle), lng: lng + lngOffset*Math.cos(angle) });
    }
  }
  return coords;
}

export async function extractLeadsFromMap(
  lat: number,
  lng: number,
  radius: number,
  keywords: string,
  searchMode: string,
  onProgress?: (msg: string) => void,
  onLead?: (lead: any) => void,
  maxLeads: number = 50
) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const coords = generateCoordinates(lat, lng, radius, searchMode);
  onProgress?.(`[SYSTEM] Initialized ${searchMode} mode with ${coords.length} geographic points.`);

  let leads: any[] = [];
  const processedUrls = new Set<string>();
  const feedSelector = 'div[role="feed"]';

  const shouldStop = () => {
    const job = (global as any).scraperJob;
    return job && !job.isSearching;
  };

  let consentClicked = false;

  for (let i = 0; i < coords.length; i++) {
    if (shouldStop() || leads.length >= maxLeads) break;

    const coord = coords[i];
    const searchQuery = keywords.trim() || "businesses"
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/@${coord.lat},${coord.lng},15z?hl=en`;
    onProgress?.(`[MAPS] [Point ${i+1}/${coords.length}] Scanning ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}...`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    if (!consentClicked) {
      try {
        const consentButton = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
        if (await consentButton.isVisible({ timeout: 5000 })) {
          await page.mouse.move(100 + Math.random()*200, 100 + Math.random()*200);
          await consentButton.click();
          await page.waitForTimeout(1000 + Math.random() * 1000);
          consentClicked = true;
        }
      } catch (e) { }
    }

    await page.waitForTimeout(3000 + Math.random() * 2000);
    
    let scrollAttempts = 0;
    let emptyScrolls = 0;

    while (scrollAttempts < 5 && emptyScrolls < 2) {
      if (shouldStop() || leads.length >= maxLeads) break;

      const currentLeads = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
        return links.map(link => {
          const title = link.getAttribute('aria-label') ||
            link.querySelector('.fontHeadlineSmall')?.textContent ||
            link.textContent || "";
          const url = link.getAttribute('href') || "";
          return { title: title.trim(), url };
        }).filter(l => l.title !== "" && l.url !== "");
      });

      let foundNew = false;
      for (const lead of currentLeads) {
        if (shouldStop() || leads.length >= maxLeads) break;
        if (!processedUrls.has(lead.url)) {
          processedUrls.add(lead.url);
          foundNew = true;
          const analyzed = {
            ...lead,
            id: Math.random().toString(36).substr(2, 9),
            website: "", phone: "", rating: 0, score: 0, category: "", opinionCount: 0, address: "",
            status: "Pending", type: keywords, createdAt: Date.now()
          };
          onProgress?.(`[DISCOVERY] Found: ${analyzed.title}`);
          leads.push(analyzed);
        }
      }

      if (!foundNew) emptyScrolls++;
      else emptyScrolls = 0;

      if (leads.length >= maxLeads || shouldStop()) break;

      await page.evaluate((sel) => {
        const feed = document.querySelector(sel);
        if (feed) feed.scrollBy(0, 500 + Math.random() * 500);
        else window.scrollBy(0, 800);
      }, feedSelector);

      await page.mouse.move(200 + Math.random() * 400, 300 + Math.random() * 300);
      await page.waitForTimeout(1500 + Math.random() * 1500);
      scrollAttempts++;
      onProgress?.(`[ENGINE] Collected so far: ${leads.length}/${maxLeads}`);
    }
  }

  onProgress?.(`[SYSTEM] Deep-analyzing ${leads.length} prospects...`);

  for (const lead of leads) {
    if (shouldStop()) break;
    try {
      await page.waitForTimeout(1000 + Math.random() * 2000);
      await page.goto(lead.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000 + Math.random() * 1000);

      try {
        // Wait for details to appear
        await page.waitForSelector('h1.DUwDvf', { timeout: 10000 });
        
        // Website - Try exact locators in order of priority to avoid random social links
        const webLocators = [
          page.locator('a[data-item-id="authority"]'),
          page.locator('a[data-tooltip="Open website"]'),
          page.locator('a[data-tooltip="Otwórz stronę"]'),
          page.locator('a[aria-label^="Website:"]')
        ];

        for (const loc of webLocators) {
          if (await loc.isVisible({ timeout: 1000 })) {
            const href = await loc.getAttribute('href');
            if (href) {
              lead.website = href;
              break;
            }
          }
        }
      } catch (e) { }

      try {
        // Phone - Try multiple variations
        const phoneLocators = [
          page.locator('button[data-item-id^="phone:tel:"]'),
          page.locator('a[data-item-id^="phone:tel:"]'),
          page.locator('button[aria-label^="Phone:"]'),
          page.locator('[data-tooltip="Copy phone number"]')
        ];

        for (const loc of phoneLocators) {
          if (await loc.isVisible({ timeout: 1000 })) {
            const attr = await loc.getAttribute('data-item-id') || await loc.getAttribute('aria-label') || "";
            lead.phone = attr.replace("phone:tel:", "").replace("Phone: ", "").trim();
            if (lead.phone) break;
          }
        }
      } catch (e) { }

      try {
        const ratingEl = page.locator('div.F7nice span[aria-hidden="true"]').first();
        const text = await ratingEl.innerText();
        lead.rating = parseFloat(text.replace(",", "."));
      } catch (e) { }

      try {
        const opinionEl = page.locator('button[aria-label*="reviews"], button[aria-label*="opinii"], button[aria-label*="review"]').first();
        if (await opinionEl.isVisible({timeout: 1000})) {
          const text = await opinionEl.innerText();
          const match = text.replace(/\s/g, '').match(/\d+/g);
          if (match) lead.opinionCount = parseInt(match.join(""), 10);
        }
      } catch(e) {}
      
      try {
        const addressEl = page.locator('button[data-item-id="address"]').first();
        if (await addressEl.isVisible({timeout: 1000})) {
          const raw = await addressEl.getAttribute('aria-label') || await addressEl.innerText();
          lead.address = raw.replace("Address: ", "").replace("Adres: ", "").trim();
        }
      } catch(e) {}

      const { score, category } = calculateLeadScore(lead as LeadData);
      lead.score = score;
      lead.category = category;
      lead.status = "Review";

      onLead?.(lead);
      onProgress?.(`[ANALYZER] OK: ${lead.title}`);

    } catch (e) {
      onProgress?.(`[ANALYZER] Skip: ${lead.title}`);
    }
  }

  await browser.close();
  return leads;
}
