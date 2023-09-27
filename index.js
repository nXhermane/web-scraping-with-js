import cheerio from "cheerio";
import fetch from "node-fetch";
import fs from "fs";

const url = "https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/";
let urlError=[]
const MAX_RETRY_ATTEMPTS = 3; 
async function fetchPage(url) {
  
    try {
      const response = await fetch(url,{ timeout: 5000 });
      const HtmlData = await response.text();
      return HtmlData;
    } catch (error) {
		 console.error(`: Une erreur s'est produite lors de la requête :`, error);
		 urlError.push(url)
     console.log(urlError.length)
	}
}

let dataStructureForPackage = [];

function addMainCategory(name, subcategories) {
  return {
    name: name,
    subcategories: subcategories,
  };
}

function addDeclarationToCategory(name, description, code, url,subcategories) {
  return {
    name: name,
    content: {
      description: description,
      code: code,
    },
    subcategories: subcategories,
    url:url
  };
}

function addSubcategoryToCategory(name, declarations) {
  return {
    name: name,
    declarations: declarations,
  };
}

function addDeclarationToSubcategory(name, description, code) {
  return {
    name: name,
    content: {
      description: description,
      code: code,
    },
  };
}

let urlArray = [];

async function getHtmlData(html) {
  if (!html) {
    // Gère le cas où la récupération HTML a échoué
    return;
  }

  const $ = cheerio.load(html);
  const pageContent = $("article.page-content");
  const allH3 = pageContent.find("h3");
  const allApiDeclaration = pageContent.find("div.api-declarations-list");

  allH3.each((index, element) => {
    const categorieName = $(element).text();
    const subCategoriesList = [];
   // console.log(`category => ${$(element).text()}`);
    const apiDeclaration = allApiDeclaration.eq(index);
    const allDeclaration = apiDeclaration.find("div.declarations");

    allDeclaration.each(async (i, e) => {
      const h4Element = $(e).find("h4 a");
      const descriptionElement = $(e).find("div.summary-group p");
      const codeElement = $(e).find("div.signature code");
      const {descArray,codeArray}=Descode(descriptionElement,codeElement,$)
     // console.log(`1st page ===>${h4Element.text()}`);
      let subCategoriesListDeclaration;
      const urlOfSub = `${url}${h4Element.attr("href")}`;
      urlArray.push(urlOfSub)
      subCategoriesList.push(addDeclarationToCategory(h4Element.text(),descArray,codeArray,urlOfSub,[]))
    });
    dataStructureForPackage.push(addMainCategory(categorieName,subCategoriesList))
  });
  
}

async function getHtmlData2(htmlData) {
  if (!htmlData) {
    // Gère le cas où la récupération HTML a échoué
    return;
  }

  const $ = cheerio.load(htmlData);
  const pageContent = $("article.page-content");
  const allH3 = pageContent.find("h3");
  const allApiDeclaration = pageContent.find("div.api-declarations-list");
const subCat=[]
  allH3.each((index, element) => {
    const categorieName = $(element).text();
    const subCategoriesList = [];
    //console.log(`2nd page category ===>${categorieName}`);
    const apiDeclaration = allApiDeclaration.eq(index);
    const allDeclaration = apiDeclaration.find("div.declarations");

    allDeclaration.each((i, e) => {
      const h4Element = $(e).find("h4 a");
      const descriptionElement = $(e).find("div.summary-group p");
      const codeElement = $(e).find("div.signature code");
      const {descArray,codeArray}=Descode(descriptionElement,codeElement,$)
     subCategoriesList.push(addDeclarationToSubcategory(h4Element.text(),descArray,codeArray))
      
    });
    subCat.push(addSubcategoryToCategory(categorieName,subCategoriesList))
  });
  console.log(subCat)
  return subCat
}

(async () => {
  const htmlData = await fetchPage(url);
  await getHtmlData(htmlData);
  for(let i=0;i< dataStructureForPackage.length;i++){
	const dataStruct=dataStructureForPackage[i].subcategories
	await	dataStruct.forEach(async (e)=>{
	     	const dataHtmlPage2= await fetchPage(e.url)
	     dataStruct.subcategories=await getHtmlData2(dataHtmlPage2)
	})
  }
  const data=JSON.stringify(dataStructureForPackage)
  fs.writeFileSync('kotlin.json',data)
})();
function Descode(desc,code,$){
	let descArray=[]
	let codeArray = []
	desc.each((i,e)=>{
		descArray.push($(e).text())
	})
	code.each((i,e)=>{
		codeArray.push($(e).text())
	})
	return {descArray,codeArray}
}