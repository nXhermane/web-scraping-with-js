import cheerio from "cheerio";
import fetch from "node-fetch";
import fs from "fs";

const BASE_URL = "https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/";

class Declaration {
	constructor(name, description, code) {
		this.name = name;
		this.description = description;
		this.code = code;
	}
}

class Subcategory1 {
	constructor(name, description, code, url) {
		this.name = name;
		this.description = description;
		this.code = code;
		this.url = url;
		this.subcategories = [];
	}

	addDeclaration(name) {
		this.subcategories.push(new subcategory2(name));
	}
	async run(url) {
		console.log("Extraction de subCategory")
		await this.extractData(url)
		console.log("Extration de SubCategory Terminer")
	}
	async fetchpage(url) {
		try {
			const response = await fetch(url, { timeout: 5000 });
			const HtmlData = await response.text();
			return HtmlData
		} catch (error) {
			console.error(`: Une erreur s'est produite lors de la requête :`, error);
			return null
		}
	}
	async extractData(url) {
		const htmlData = await this.fetchpage(url)
		if (!htmlData) return
		const $ = cheerio.load(htmlData)
		const pageContent = $("article.page-content");
		const allH3 = pageContent.find("h3");
		const allApiDeclaration = pageContent.find("div.api-declarations-list");
		this.extractDeclaration(allH3, allApiDeclaration, $)

	}
	extractDeclaration(allh3, allApiDeclaration, $) {

		allh3.each((index, element) => {
			const categoryName = $(element).text()
			const category = new subcategory2(categoryName)
			const apiDeclaration = allApiDeclaration.eq(index);

			const declarations = apiDeclaration.find("div.declarations");
			declarations.each((i, e) => {
				const h4 = $(e).find("h4 a").text()
				const url = $(e).find("h4 a").attr('href')
				const descriptionGroup = $(e).find("div.summary-group p")
				const codeGroup = $(e).find("div.signature code");
				const { descArray, codeArray } = this.descCode(descriptionGroup, codeGroup, $)
				category.addDeclaration(h4, descArray, codeArray)
			})
			this.subcategories.push(category)
		})

	}
	descCode(descriptions, codes, $) {
		let descArray = []
		let codeArray = []
		descriptions.each((i, e) => {
			descArray.push($(e).text())
		})
		codes.each((i, e) => {
			codeArray.push($(e).text())
		})
		return { descArray, codeArray }
	}


}
class subcategory2 {
	constructor(name) {
		this.name = name;
		this.declarations = [];
	}

	addDeclaration(name, description, code) {
		this.declarations.push(new Declaration(name, description, code));
	}
}

class Category {

	constructor(name) {
		this.name = name;
		this.subcategories = [];
	}

async	addSubcategory(name, description, code, url) {
     		const subcategory = new Subcategory1(name, description, code, url);
     		await subcategory.run(`${BASE_URL}${url}`)
     		this.subcategories.push(subcategory);
     	}
}
class dataScraper {
	data = []
	constructor() {
		//	console.log("=====> Extraction Commencer  <")
	}
	async run(base_url) {
		console.log("=====> Extraction Commencer  <")
		await this.extractData(base_url)
		console.log(`Extractiin Terminer avec ${this.data.length} de categorie`)
	}
	async fetchpage(url) {
		try {
			const response = await fetch(url, { timeout: 5000 });
			const HtmlData = await response.text();
			return HtmlData
		} catch (error) {
			console.error(`: Une erreur s'est produite lors de la requête :`, error);
			return null
		}
	}

	async extractData(url) {
		const htmlData = await this.fetchpage(url)
		if (!htmlData) return
		const $ = cheerio.load(htmlData)
		const pageContent = $("article.page-content");
		const allH3 = pageContent.find("h3");
		const allApiDeclaration = pageContent.find("div.api-declarations-list");
		this.extractSubCategorie(allH3, allApiDeclaration, $)


	}
	 extractSubCategorie(allh3, allApiDeclaration, $) {

		allh3.each((index, element) => {
			const categoryName = $(element).text()
			const category = new Category(categoryName)
			const apiDeclaration = allApiDeclaration.eq(index);

			const declarations = apiDeclaration.find("div.declarations");
			
			declarations.each(async (i, e) => {
			       	const h4 = $(e).find("h4 a").text()
			       	const url = $(e).find("h4 a").attr('href')
			       	const descriptionGroup = $(e).find("div.summary-group p")
			       	const codeGroup = $(e).find("div.signature code");
			       	const { descArray, codeArray } = this.descCode(descriptionGroup, codeGroup, $)
			  await	category.addSubcategory(h4, descArray, codeArray, url)
			//     	console.log(this.data)
			})
			this.data.push(category)
		})

	}
	descCode(descriptions, codes, $) {
		let descArray = []
		let codeArray = []
		descriptions.each((i, e) => {
			descArray.push($(e).text())
		})
		codes.each((i, e) => {
			codeArray.push($(e).text())
		})
		return { descArray, codeArray }
	}

}
(async () => {
  	// const scrapping = new dataScraper(BASE_URL)
//	await scrapping.run(BASE_URL)
//	fs.writeFileSync("otlin.json",JSON.stringify(scrapping.data))
const sub = new Subcategory1()
await sub.run(BASE_URL)
console.log(sub.subcategories)
})()