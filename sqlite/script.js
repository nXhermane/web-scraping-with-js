import knex from 'knex';
import fs from 'fs';

const db = knex({
	client: 'sqlite3',
	connection: {
		filename: './auto_complt.db',
	},
	useNullAsDefault: true,
});

// Uncomment the code below to create tables, but only execute it once.
// Note that this may throw an error if the tables already exist.

try {
  (async () => {
    const tableExists = await db.schema.hasTable("kotlin_native");
    if (!tableExists) {
      await db.schema.createTable("kotlin_native", (table) => {
        table.increments("id_native").primary();
        table.string("data_type");
        table.string("global_keyword");
        table.json("global_description");
        table.json("global_code");
        table.string("data_url");
      });
    }
    const tableExists2 = await db.schema.hasTable("kotlin_native_keyword");
    if (!tableExists2) {
      // Now we can create the second table with a foreign key
      await db.schema.createTable("kotlin_native_keyword", (table) => {
        table.increments("id_keyword").primary();
        table.integer("native_id").unsigned(); // Adding native_id column
        table.foreign("native_id").references("kotlin_native.id_native");
        table.string("keyword_type");
        table.string("keyword");
        table.json("keyword_detail");
        table.json("keyword_code");
      });
    }
    console.log('Tables created successfully.');
  })();
} catch (error) {
  console.error('Error creating tables:', error);
}

const filePath = 'kotlin.json';

async function loadJsonFile(filePath) {
	try {
		const jsonContent = await fs.readFileSync(filePath, 'utf8');
		return JSON.parse(jsonContent);
	} catch (error) {
		console.error('Error reading JSON file:', error);
		throw error;
	}
}

loadJsonFile(filePath)
	.then(data => {
		managedata(data);
	})
	.catch(error => {
		console.error('An error occurred while loading the JSON file:', error);
	})
	.finally(() => {
		// Close the database connection here to ensure it's properly closed.
		db.destroy();
	});

async function managedata(data) {
	let count = 0;
	for (let i = 0; i < data.length; i++) {
		const data_type = data[i].name;
		const subcategories = data[i].subcategories;
		for (let j = 0; j < subcategories.length; j++) {
			const subcategory = subcategories[j];
			const global_keyword = subcategory.name;
			const global_description = JSON.stringify(subcategory.description);
			const global_code = JSON.stringify(subcategory.code);
			const data_url = subcategory.url;
			const idNative = await insertDataIntoKotlinNative(db, data_type, global_keyword, global_description, global_code, data_url);

			for (let k = 0; k < subcategory.subcategories.length; k++) {
				const keyword_type = subcategory.subcategories[k].name;
				const declarations = subcategory.subcategories[k].declarations;

				if (declarations.length === 0) {
					// Add a default entry if no declarations are available
					const defaultDeclarationName = "No declaration available";
					const defaultDeclarationDescription = JSON.stringify("No description available");
					const defaultDeclarationCode = JSON.stringify("No code available");
					const idKeyword = await insertDataIntoKotlinNativeKeyword(db, idNative, keyword_type, defaultDeclarationName, defaultDeclarationDescription, defaultDeclarationCode);
					count++;
				} else {
					for (let z = 0; z < declarations.length; z++) {
						const keyword = declarations[z].name;
						const keyword_detail = JSON.stringify(declarations[z].description);
						const keyword_code = JSON.stringify(declarations[z].code);
						const idKeyword = await insertDataIntoKotlinNativeKeyword(db, idNative, keyword_type, keyword, keyword_detail, keyword_code);
						count++;
					}
				}
			}
		}
	}
	console.log(`Total records processed: ${count}`);
}

async function insertDataIntoKotlinNative(db, data_type, global_keyword, global_description, global_code, data_url) {
	try {
		const [id_native] = await db("kotlin_native").insert({
			data_type,
			global_keyword,
			global_description,
			global_code,
			data_url,
		});
		return id_native;
	} catch (error) {
		console.error('Error inserting into kotlin_native table:', error);
		throw error;
	}
}

async function insertDataIntoKotlinNativeKeyword(db, native_id, keyword_type, keyword, keyword_detail, keyword_code) {
	try {
		const [id_keyword] = await db("kotlin_native_keyword").insert({
			native_id,
			keyword_type,
			keyword,
			keyword_detail,
			keyword_code,
		});
		return id_keyword;
	} catch (error) {
		console.error('Error inserting into kotlin_native_keyword table:', error);
		throw error;
	}
}
