declare module "better-sqlite3" {
  export interface Statement<Params = unknown, Result = unknown> {
    get(...params: Params extends unknown[] ? Params : [Params]): Result | undefined
    run(params?: Params): unknown
  }

  export default class Database {
    constructor(filename: string)
    exec(sql: string): this
    pragma(sql: string): unknown
    prepare<Params = unknown, Result = unknown>(
      sql: string,
    ): Statement<Params, Result>
    transaction<T extends (...args: never[]) => unknown>(fn: T): T
    close(): void
  }
}
