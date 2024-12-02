import { NewsApiResponse, NewsApiResponseType, NewsApiSearchParams, NewsApiSearchParamsType, transformedSchema } from "../types.ts";

const BASE_URL = 'https://newsapi.org/v2/top-headlines';

export class NewsApi {
    constructor(private apiKey: string) {
    }

    getHeadlines(searchParams: NewsApiSearchParamsType): Promise<NewsApiResponseType>  {
        const params =  NewsApiSearchParams.parse(searchParams) ?? {};
        const searchParamString = new URLSearchParams(transformedSchema.parse(params)).toString();
        const requestUrl = `${BASE_URL}?${searchParamString}`;
        return this.fetch(requestUrl);
    }

    protected async fetch(requestUrl: string): Promise<NewsApiResponseType> {
        const response = await fetch(requestUrl, {
            headers: {
                "X-Api-Key": this.apiKey,
                "Accept": "application/json"
            }
        });
        const json = await response.json();
        return NewsApiResponse.parse(json);
    }
}