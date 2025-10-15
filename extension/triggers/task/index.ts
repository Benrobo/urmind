interface TaskConfig<T = any> {
  id: string;
  run: (payload: T) => Promise<any>;
  onFailure?: (error: Error) => void;
}

export class Task<T = any> {
  private config: TaskConfig<T>;

  constructor(config: TaskConfig<T>) {
    this.config = config;
  }

  async trigger(payload: T) {
    try {
      console.log(`Running task: ${this.config.id}`);
      const result = await this.config.run(payload);
      console.log(`Task ${this.config.id} completed successfully`);
      return result;
    } catch (error) {
      console.error(`Task ${this.config.id} failed:`, error);
      if (this.config.onFailure) {
        this.config.onFailure(error as Error);
      }
      throw error;
    }
  }
}

export function task<T = any>(config: TaskConfig<T>): Task<T> {
  return new Task(config);
}
