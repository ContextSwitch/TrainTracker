declare function describe(description: string, specDefinitions: () => void): void;
declare function beforeEach(action: () => void): void;
declare function afterEach(action: () => void): void;
declare function it(expectation: string, assertion: () => void | Promise<void>): void;
