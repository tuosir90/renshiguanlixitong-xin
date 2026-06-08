import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
        <span>© {currentYear} 呈尚策划 · 人事管理系统</span>
        <span className="text-xs">Digital HR Management</span>
      </div>
    </footer>
  );
}
