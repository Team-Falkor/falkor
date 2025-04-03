import { igdb } from "./index";
import { Theme, IGDBReturnDataType } from "./types";

class ThemeAPI {
  /**
   * Get theme details by ID
   * @param themeId The ID of the theme to fetch
   * @returns Theme details
   */
  async getThemeById(themeId: string | number): Promise<Theme> {
    const data = await igdb.request<Theme[]>("themes", {
      where: `id = ${themeId}`,
      fields: ["name", "slug", "url"], 
    },
 false
);
    
    return data[0];
  }

  /**
   * Get games by theme ID
   * @param themeId The ID of the theme to fetch games for
   * @param limit Number of games to fetch (default: 50)
   * @param offset Offset for pagination (default: 0)
   * @returns Array of games matching the theme
   */
  async getGamesByThemeId(
    themeId: string | number,
    limit: number = 50,
    offset: number = 0
  ): Promise<IGDBReturnDataType[]> {
    const data = await igdb.request<IGDBReturnDataType[]>("games", {
      sort: "total_rating desc",
      where: `platforms.abbreviation = "PC" & themes = ${themeId} & category = 0 & version_parent = null`,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return data;
  }
}

const themeAPI = new ThemeAPI();
export { themeAPI };