import cheerio from "cheerio";
import fetch from "node-fetch";
import fs from "fs";

const BASE_URL = "https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/";

// Class to represent a Declaration
class Declaration {
  constructor(name, description, code) {
    this.name = name;
    this.description = description;
    this.code = code;
  }

  async initializeDataFromAPI(url) {
    // Initialization code to fetch data from the API (if necessary)
  }
}

// Class to represent a Level 1 Subcategory
class LevelOneSubcategory {
  constructor(name, description, code, url) {
    this.name = name;
    this.description = description;
    this.code = code;
    this.url = url;
    this.subcategories = [];
  }

  async addDeclaration(name) {
    const declaration = new LevelTwoSubcategory(name);
    await declaration.initializeDataFromAPI(this.url);
    this.subcategories.push(declaration);
  }

  async runExtraction(url) {
    console.log("Extracting subCategory");
    await this.extractDataFromURL(url);
    console.log("SubCategory Extraction Completed");
  }

  async fetchDataFromURL(url) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      const htmlData = await response.text();
      return htmlData;
    } catch (error) {
      console.error(`An error occurred during the request:`, error);
      return null;
    }
  }

  async extractDataFromURL(url) {
    const htmlData = await this.fetchDataFromURL(url);
    if (!htmlData) return null;
    const $ = cheerio.load(htmlData);
    const pageContent = $("article.page-content");
    const allH3 = pageContent.find("h3");
    const allApiDeclaration = pageContent.find("div.api-declarations-list");
    await this.extractDeclarations(allH3, allApiDeclaration, $);
  }

  async extractDeclarations(allH3, allApiDeclaration, $) {
    for (let index = 0; index < allH3.length; index++) {
      const element = allH3[index];
      const categoryName = $(element).text();
      const category = new LevelTwoSubcategory(categoryName);
      const apiDeclaration = allApiDeclaration.eq(index);

      const declarations = apiDeclaration.find("div.declarations");
      for (let i = 0; i < declarations.length; i++) {
        const e = declarations[i];
        const declarationName = $(e).find("h4 a").text();
        const declarationURL = $(e).find("h4 a").attr("href");
        const descriptionGroup = $(e).find("div.summary-group p");
        const codeGroup = $(e).find("div.signature code");
        const { descriptionArray, codeArray } = this.extractDescriptionAndCode(descriptionGroup, codeGroup, $);
        await category.addDeclaration(declarationName, descriptionArray, codeArray, declarationURL);
      }
      this.subcategories.push(category);
    }
  }

  extractDescriptionAndCode(descriptionGroup, codeGroup, $) {
    let descriptionArray = [];
    let codeArray = [];
    descriptionGroup.each((i, e) => {
      descriptionArray.push($(e).text());
    });
    codeGroup.each((i, e) => {
      codeArray.push($(e).text());
    });
    return { descriptionArray, codeArray };
  }
}

// Class to represent a Level 2 Subcategory
class LevelTwoSubcategory {
  constructor(name) {
    this.name = name;
    this.declarations = [];
  }

  async addDeclaration(name, description, code) {
    const declaration = new Declaration(name, description, code);
    await declaration.initializeDataFromAPI(this.url);
    this.declarations.push(declaration);
  }

  async initializeDataFromAPI(url) {
    // Initialization code to fetch data from the API (if necessary)
  }
}

// Class to represent a Category
class Category {
  constructor(name) {
    this.name = name;
    this.subcategories = [];
  }

  async addLevelOneSubcategory(name, description, code, url) {
    const subcategory = new LevelOneSubcategory(name, description, code, url);
    await subcategory.runExtraction(`${BASE_URL}${url}`);
    this.subcategories.push(subcategory);
  }
}

// Main class for data extraction
class DataScraper {
  extractedData = [];

  constructor() {
    //	console.log("=====> Extraction Started  <")
  }

  async runExtraction(baseURL) {
    console.log("=====> Extraction Started  <");
    await this.extractDataFromURL(baseURL);
    console.log(`Extraction Completed with ${this.extractedData.length} categories`);
  }

  async fetchDataFromURL(url) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      const htmlData = await response.text();
      return htmlData;
    } catch (error) {
      console.error(`An error occurred during the request:`, error);
      return null;
    }
  }

  async extractDataFromURL(url) {
    const htmlData = await this.fetchDataFromURL(url);
    if (!htmlData) return null;
    const $ = cheerio.load(htmlData);
    const pageContent = $("article.page-content");
    const allH3 = pageContent.find("h3");
    const allApiDeclaration = pageContent.find("div.api-declarations-list");
    await this.extractSubcategories(allH3, allApiDeclaration, $);
  }

  async extractSubcategories(allH3, allApiDeclaration, $) {
    for (let index = 0; index < allH3.length; index++) {
      const element = allH3[index];
      const categoryName = $(element).text();
      const category = new Category(categoryName);
      const apiDeclaration = allApiDeclaration.eq(index);

      const declarations = apiDeclaration.find("div.declarations");
      for (let i = 0; i < declarations.length; i++) {
        const e = declarations[i];
        const subcategoryName = $(e).find("h4 a").text();
        const subcategoryURL = $(e).find("h4 a").attr("href");
        const descriptionGroup = $(e).find("div.summary-group p");
        const codeGroup = $(e).find("div.signature code");
        const { descriptionArray, codeArray } = this.extractDescriptionAndCode(descriptionGroup, codeGroup, $);
        await category.addLevelOneSubcategory(subcategoryName, descriptionArray, codeArray, subcategoryURL);
      }
      this.extractedData.push(category);
    }
  }

  extractDescriptionAndCode(descriptionGroup, codeGroup, $) {
    let descriptionArray = [];
    let codeArray = [];
    descriptionGroup.each((i, e) => {
      descriptionArray.push($(e).text());
    });
    codeGroup.each((i, e) => {
      codeArray.push($(e).text());
    });
    return { descriptionArray, codeArray };
  }
}

(async () => {
  const scraper = new DataScraper(BASE_URL);
  await scraper.runExtraction(BASE_URL);
  fs.writeFileSync("kotlin.json", JSON.stringify(scraper.extractedData));
  // const sub = new LevelOneSubcategory()
  // await sub.runExtraction(BASE_URL)
  // console.log(sub.subcategories)
})();
