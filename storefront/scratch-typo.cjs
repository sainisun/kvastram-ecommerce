const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://shopmulmul.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Wait a few seconds for fonts and styles to be applied
  await new Promise(r => setTimeout(r, 5000));
  
  const extractStyles = async (selector) => {
    return page.evaluate((sel) => {
      const elements = Array.from(document.querySelectorAll(sel)).slice(0, 5);
      if (elements.length === 0) return null;
      
      const styles = new Set();
      elements.forEach(el => {
        const computed = window.getComputedStyle(el);
        styles.add(JSON.stringify({
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          lineHeight: computed.lineHeight,
          letterSpacing: computed.letterSpacing,
          textTransform: computed.textTransform
        }));
      });
      
      return Array.from(styles).map(s => JSON.parse(s));
    }, selector);
  };
  
  const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'span'];
  const results = {};
  
  for (const sel of selectors) {
    results[sel] = await extractStyles(sel);
  }
  
  console.log(JSON.stringify(results, null, 2));
  
  await browser.close();
})();
