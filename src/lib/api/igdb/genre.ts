import { igdb } from "./index";
import { Genre, IGDBReturnDataType } from "./types";

class GenreAPI {
  /**
   * Get genre details by ID
   * @param genreId The ID of the genre to fetch
   * @returns Genre details
   */
  async getGenreById(genreId: string | number): Promise<Genre> {
    const data = await igdb.request<Genre[]>("genres", {
      where: `id = ${genreId}`,
      fields: ["name", "slug", "url"], 
    },
 false
);
    
    return data[0];
  }

  /**
   * Get games by genre ID
   * @param genreId The ID of the genre to fetch games for
   * @param limit Number of games to fetch (default: 50)
   * @param offset Offset for pagination (default: 0)
   * @returns Array of games matching the genre
   */
  async getGamesByGenreId(
    genreId: string | number,
    limit: number = 50,
    offset: number = 0
  ): Promise<IGDBReturnDataType[]> {
    const data = await igdb.request<IGDBReturnDataType[]>("games", {
      sort: "total_rating desc",
      where: `platforms.abbreviation = "PC" & genres = ${genreId} & category = 0 & version_parent = null`,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return data;
  }
}

const genreAPI = new GenreAPI();
export { genreAPI };