export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 회원가입 후 넘어가는 온보딩 과정의 레이아웃
  return <>{children}</>;
}
