import {Controller,ControllerConfig,Result,TaskError,TaskErrorBag,Bag,SmallBag}
from 'zation-server';

export class MyController extends Controller
{
    static config : ControllerConfig = {
    };

    async handle(bag : Bag,{}) {
    }

    async initialize(smallBag : SmallBag) {
    }

    async wrongInput(bag : Bag,input) {
    }
}