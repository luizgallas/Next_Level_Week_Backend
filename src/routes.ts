import express from 'express';

import ClassesControler from './controllers/classesControler';
import ConnectionsController from './controllers/conectionsController';

const routes = express.Router();
const classesControler = new ClassesControler();
const connectionsController = new ConnectionsController();

routes.post('/classes',  classesControler.create);
routes.get('/classes',  classesControler.index);

routes.post('/connections', connectionsController.create);
routes.get('/connections', connectionsController.index);

export default routes;
