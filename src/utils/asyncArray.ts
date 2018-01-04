export class AsyncArray<T> extends Array<T> {

    private consumers: Array<(v: T) => {}> = [];

    public async consume() {
      return new Promise<T>((resolve) => {
        const element = this.shift();
        if (element) {
          resolve(element);
        } else {
          this.consumers.push(resolve as any);
        }
      });
    }

    public produce(v: T) {
      const consumer = this.consumers.shift();
      if (consumer) {
        consumer(v);
        return 0;
      }
      return this.push(v);
    }
  }