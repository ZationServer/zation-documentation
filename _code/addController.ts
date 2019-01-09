import {Config}       from 'zation-server';
import {MyController} from "../controllers/myController";

module.exports = Config.appConfig(
    {
        ...
        controllers :
            {
                myController : MyController,
            }
    });