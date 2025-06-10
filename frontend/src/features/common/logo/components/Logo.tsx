import { Newspaper } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-black-600/20">
        <Newspaper className="h-5 w-5" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        PRNews
      </span>
    </div>
  );
};

export default Logo;
