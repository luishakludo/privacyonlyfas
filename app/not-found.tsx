export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-sm font-medium tracking-widest text-muted-foreground">ERRO 404</p>
      <h1 className="mt-4 text-balance text-4xl font-bold text-foreground sm:text-5xl">
        Página não encontrada
      </h1>
      <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
        A página que você tentou acessar não existe ou foi removida.
      </p>
    </main>
  )
}
