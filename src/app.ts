import { Application } from "express";
import * as express from "express";
import { connect, Model, Trilogy } from 'trilogy'

type JsonValueType = string | number | any[] | object;

class App {
  private app: Application;
  private db: Trilogy;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.db = connect('./file.db');

    this.setupDatabase()
      .then(this.setupDatabaseModels.bind(this))
      .then(this.setupRestApi.bind(this));
  }

  setupDatabase() {
    return this.db.model<{name: String, model: {[id: string]: string}}>('models', {
      name: String,
      model: Object
    });
  }

  setupDatabaseModels(types: Model<{name: String, model: {[id: string]: string}}>) {
    types.find().then(typeModels => 
      typeModels.forEach(typeModel => 
        this.db.model(typeModel.name.toString(), this.schemaToTrilogy(typeModel.model))
      )
    )
  }

  setupRestApi() {
    this.app.post('/:modelId', (req, res) => 
      this.db.hasModel(req.params['modelId'])
        .then(async (exists) => {
          const typeName = req.params['modelId'];

          if (!exists) {
            const schema = this.objectToSchema(req.body);

            console.log(schema);
            
            console.log(await this.db.create('models', {
              name: typeName,
              model: schema
            }));

            const tril = this.schemaToTrilogy(schema);
            await this.db.model(typeName, tril);

            res.json(await this.db.create(typeName, req.body));
          }
        })
      )

    this.app.get('/:modelId/:entryId', async (req, res) =>
      res.json(await this.db.findOne(req.params['modelId'], { id: req.params['entryId'] })));

    this.app.put('/:modelId/:entryId', async (req, res) => 
      res.send(await this.db.update(req.params['modelId'], { id: req.params['entryId'] }, req.body)));

    this.app.delete('/:modelId/:entryId', async (req, res) =>
      res.send(await this.db.remove(req.params['modelId'], { id: req.params['entryId'] })));
  }

  objectKeyToSchemaColumn(modelColumnValue: JsonValueType): ReturnType<any> {
    if (typeof modelColumnValue === 'string') {
      return 'string';
    }

    if (typeof modelColumnValue === 'number') {
      return 'number';
    }

    if (Array.isArray(modelColumnValue)) {
      return 'array';
    }
    
    if (typeof modelColumnValue === 'object') {
      return 'abject';
    }

    return 'string';
  }
  
  objectToSchema(modelObject: {[id: string]: JsonValueType}): {[id: string]: ReturnType<any>} {
    return Object.keys(modelObject).reduce((result, key) => {
      result[key] = this.objectKeyToSchemaColumn(modelObject[key])
      return result;
    }, {});
  }

  schemaColumntoTrilogyColumn(schemaColumn: string): ReturnType<any> {
    switch(schemaColumn) {
      case 'string': return String;
      case 'number': return Number;
      case 'array': return Array;
      case 'object': return Object;
      default: return String;
    }
  }

  schemaToTrilogy(modelObject: {[id: string]: string }): {[id: string]: ReturnType<any>} {
    return {...Object.keys(modelObject).reduce((result, key) => {
      result[key] = this.schemaColumntoTrilogyColumn(modelObject[key])
      return result;
    }, {}), id: 'increments'};
  }

  convertToGraphqlSchema() {

  }

  public listen(port: number) {
    this.app.listen(port, () => {
      console.log(`App listening on the http://localhost:${port}`)
    });
  }
}

export default App;