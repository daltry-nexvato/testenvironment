export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-50 dark:bg-zinc-950">
      <div className="group cursor-pointer select-none text-center transition-all duration-500">
        {/* Nice cat */}
        <div className="relative transition-all duration-500 group-hover:scale-110">
          <div className="text-[12rem] leading-none transition-all duration-500 group-hover:hidden">
            🐱
          </div>
          <div className="hidden text-[12rem] leading-none transition-all duration-500 group-hover:block group-hover:animate-pulse">
            😈
          </div>
        </div>

        {/* Nice text */}
        <p className="mt-4 text-2xl font-semibold text-pink-500 transition-all duration-500 group-hover:hidden">
          Hello, I&apos;m a sweet kitty~
        </p>
        <p className="mt-4 hidden text-2xl font-bold text-red-600 transition-all duration-500 group-hover:block group-hover:animate-bounce dark:text-red-500">
          I WILL CONSUME YOUR SOUL
        </p>

        {/* Subtle background effects */}
        <div className="pointer-events-none fixed inset-0 bg-transparent transition-all duration-700 group-hover:bg-red-950/30" />
      </div>
    </div>
  );
}
