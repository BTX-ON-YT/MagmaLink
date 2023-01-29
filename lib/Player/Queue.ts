export class Queue {
    private _queue: any[];

    public queuePosition: number;
    public persistent: boolean;
    public currentTrack: any;
    constructor(persistent: boolean = true) {
        this._queue = [];
        this.queuePosition = 0;
        this.persistent = persistent;
        this.currentTrack = null;
    }

    public get size(): number {
        return this._queue.length;
    }

    public get current(): any {
        return this.currentTrack;
    }

    public get queue(): any[] {
        return this._queue;
    }

    public get position(): number {
        return this.queuePosition;
    }

    public get next(): any {
        if (this.persistent) {
            let track = this._queue[this.queuePosition];
            this.queuePosition++;
            if (this.queuePosition >= this._queue.length) this.queuePosition = 0;

            return track;
        } else {
            return this._queue.shift();
        }
    }

    public get previous(): any {
        if (this.persistent) {
            let track = this._queue[this.queuePosition - 1];
            return track;
        }
    }

    public get first(): any {
        return this._queue[0];
    }

    public get last(): any {
        return this._queue[this._queue.length - 1];
    }

    public get random(): any {
        return this._queue[Math.floor(Math.random() * this._queue.length)];
    }
    public get(index: number): any {
        return this._queue[index];
    }

    public add(track: any): void {
        this._queue.push(track);
    }

    public remove(index: number): void {
        this._queue.splice(index, 1);
    }

    public clear(): void {
        this._queue = [];
        if (this.persistent) this.queuePosition = 0;
    }

    public shuffle(): void {
        this._queue = this.shuffleArray(this._queue);
    }

    private shuffleArray(array: any[]): any[] {
        let currentIndex = array.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
}