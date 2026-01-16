"use client";

export function Footer() {
  return (
    <footer className="w-full py-4 text-center text-gray-500 text-sm">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>博客：雅Kob | AI洞察</span>
        <span className="hidden sm:inline">|</span>
        <a href="mailto:lewei.me@gmail.com" className="hover:text-gray-700 transition-colors">
          邮箱：lewei.me@gmail.com
        </a>
        <span className="hidden sm:inline">|</span>
        <span>小红书：@何乐为</span>
      </div>
    </footer>
  );
}
