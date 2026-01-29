interface TestCase {
    title: string;
    description: string;
    expectedCategory: string;
    expectedKeywords: string[];
}
declare const testCases: TestCase[];
declare function testCategoryDetection(): void;
