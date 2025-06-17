export class TorBoxAPI {
    private baseUrl: string = "/api/torbox/";
    public accessToken: string;
  
    constructor(accessToken: string) {
      if (!accessToken) throw new Error("No access token provided");
      this.accessToken = accessToken;
    }
  
    async makeRequest<T>(
      endpoint: string,
      method: "GET" | "POST" | "HEAD" = "GET",
      authRequired: boolean = true,
      body?: BodyInit,
      headersInit?: HeadersInit,
      dropBase: boolean = false
    ): Promise<T> {
      let url = ``;
      if (dropBase) {
        url = `${endpoint}`;
      } else {
        url = `${this.baseUrl}${endpoint}`;
      }
  
      const headers: HeadersInit = {
        // "Content-Type": "application/json",
        ...(authRequired ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...headersInit,
      };
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? body : undefined,
        });
  
        // Check response success
        // if (!response?.ok) {
        //   switch (response?.status) {
        //     case 401:
        //       throw new Error("Bad token (expired, invalid)");
        //     case 403:
        //       throw new Error("Permission denied (account locked, not premium)");
        //     case 503:
        //       throw new Error("Hoster is unsported");
        //     default:
        //       throw new Error(
        //         `API request failed: ${response?.status || this.accessToken}`
        //       );
        //   }
        // }
  
        // if (response.status === 204) {
        //   return {} as T;
        // }
  
        const data = await response.text();
  
        if (!data) throw new Error("No data returned from API");
  
        return JSON.parse(data);
      } catch (error) {
        console.error(error);
  
        throw new Error(
          `Real Debrid error: ${(error as Error).message ?? "Unknown error"}`
        );
      }
    }
  }