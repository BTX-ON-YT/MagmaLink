import EventEmitter from "events";

export class TypedEmitter<T> extends EventEmitter {
    constructor(typesInterface: T) {
        super();

        console.log(typesInterface);
    }
}