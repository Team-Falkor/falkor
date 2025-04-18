import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

const categories = [
  { title: "Action", icon: "🎮", id: "1", type: "theme" },
  { title: "Adventure", icon: "🗺️", id: "31", type: "genre" },
  { title: "RPG", icon: "⚔️", id: "12", type: "genre" },
  { title: "Strategy", icon: "🧠", id: "15", type: "genre" },
] as const;

const GameCategories = () => {
  return (
    <div className="grid grid-cols-1 gap-6 mb-16 md:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <Card
          key={category.title}
          className="overflow-hidden transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20 group"
        >
          <CardContent className="p-0">
            <Link
              to={
                category.type === "theme"
                  ? "/theme/$themeId"
                  : "/genre/$genreId"
              }
              params={
                category.type === "theme"
                  ? { themeId: category.id }
                  : { genreId: category.id }
              }
              className="block p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 text-2xl rounded-full">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{category.title}</h3>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full w-8 h-8 p-0"
                  >
                    →
                  </Button>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GameCategories;
