export abstract class BaseQuery {
  protected initialized: boolean = false;

  abstract init(): Promise<void>;
}
