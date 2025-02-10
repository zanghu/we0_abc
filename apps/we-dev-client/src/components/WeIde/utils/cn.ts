// 用于合并 Tailwind CSS 类名的工具函数
export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}