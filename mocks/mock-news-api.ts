import { NewsApi } from "../services/news-api.ts";
import { NewsApiResponseType } from "../types.ts";
import { MockHeadlines } from "./mock-headline.ts";

export class MockNewsApi extends NewsApi {
    constructor() {
        super("");
    }

    protected override fetch(_: string): Promise<NewsApiResponseType> {
      return Promise.resolve(MockHeadlines);
    }
}