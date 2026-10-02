"use client"

import { useEffect, useRef, useState } from "react"
import { CircleNotch, UploadSimple, Trash, Plus, ImageSquare, X, Lock } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditorShell, PhonePreview, buildPreviewData } from "./editor-shell"
import {
  uploadModelImage,
  mediasTotal,
  resizeMedias,
  GRID_SIZES,
  type Model,
  type ModelConfig,
  type GridSize,
  type MediaItem,
} from "@/lib/supabase/use-models"

// ---------- Upload de imagem reutilizável ----------
function ImageUpload({
  modelId,
  url,
  onChange,
  aspect = "aspect-video",
  label,
}: {
  modelId: string
  url: string
  onChange: (url: string) => void
  aspect?: string
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const publicUrl = await uploadModelImage(modelId, file)
      onChange(publicUrl)
    } catch (err) {
      console.log("[v0] erro no upload:", err)
      alert("Falha no upload. Verifique se o bucket 'model-media' existe no Supabase.")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}
      <div
        className={`group relative ${aspect} w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-[#0b0b0b]/20 bg-[#fff8eb]`}
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
            {/* Overlay com botões no hover - só desktop */}
            <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current?.click()
                }}
                className="bg-white text-[#0b0b0b] hover:bg-white/90"
              >
                <UploadSimple className="h-3.5 w-3.5" weight="bold" />
                Trocar
              </Button>
            </div>
            {/* Botão de remover no canto - só desktop */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              className="absolute right-2 top-2 hidden rounded-lg bg-red-500 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 md:block"
            >
              <Trash className="h-4 w-4" weight="bold" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#0b0b0b]/40">
            <ImageSquare className="h-6 w-6" weight="duotone" />
            <span className="text-xs">Clique para enviar</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <CircleNotch className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      {/* Botões visíveis apenas no mobile quando tem imagem */}
      {url && (
        <div className="flex gap-2 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="bg-transparent"
          >
            <UploadSimple className="h-3.5 w-3.5" weight="bold" />
            Trocar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash className="h-3.5 w-3.5" weight="bold" />
            Remover
          </Button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}

export function ModelConfigDialog({
  model,
  onClose,
  updateModel,
}: {
  model: Model | null
  onClose: () => void
  updateModel: (id: string, patch: Partial<Model>) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [online, setOnline] = useState(false)
  const [fb, setFb] = useState("")
  const [utm, setUtm] = useState("")
  const [cfg, setCfg] = useState<ModelConfig | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  // Status do salvamento automático.
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [confirmClose, setConfirmClose] = useState(false)
  // Evita salvar logo ao abrir/carregar uma modelo (só salva em mudanças reais do usuário).
  const skipAutoSave = useRef(true)

  // Sincroniza o formulário ao abrir uma nova modelo.
  if (model && model.id !== loadedId) {
    setName(model.name)
    setHandle(model.handle)
    setAvatarUrl(model.avatar_url ?? "")
    setOnline(model.status === "online")
    setFb(model.pixel_facebook ?? "")
    setUtm(model.pixel_utmify ?? "")
    setCfg(model.config)
    setLoadedId(model.id)
    setStatus("idle")
    skipAutoSave.current = true
  }
  if (!model && loadedId) setLoadedId(null)

  // Salvamento automático com debounce: salva sozinho sempre que algo muda.
  useEffect(() => {
    if (!model || !cfg) return
    if (skipAutoSave.current) {
      skipAutoSave.current = false
      return
    }
    setStatus("saving")
    const t = setTimeout(async () => {
      try {
        await updateModel(model.id, {
          name: name.trim() || model.name,
          handle: handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim()}`,
          avatar_url: avatarUrl || null,
          bio: cfg.bio || null,
          status: online ? "online" : "rascunho",
          pixel_facebook: fb.trim() || null,
          pixel_utmify: utm.trim() || null,
          config: cfg,
        })
        setStatus("saved")
      } catch (e) {
        if (e instanceof Error && e.message === "CONFIG_COLUMN_MISSING") {
          // Dados básicos salvos; a config visual ainda não persiste (falta rodar o SQL).
          setStatus("saved")
        } else {
          console.log("[v0] erro no auto-save:", e)
          setStatus("idle")
        }
      }
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, name, handle, avatarUrl, online, fb, utm])

  if (!model) return null
  if (!cfg) {
    return (
      <EditorShell title="Carregando..." description="" status="idle" onClose={onClose}>
        <div className="flex items-center justify-center py-20 text-[#0b0b0b]/50">
          <CircleNotch className="mr-2 h-4 w-4 animate-spin" /> Carregando...
        </div>
      </EditorShell>
    )
  }

  const patch = (p: Partial<ModelConfig>) => setCfg((c) => (c ? { ...c, ...p } : c))
  const patchStats = (p: Partial<ModelConfig["stats"]>) =>
    setCfg((c) => (c ? { ...c, stats: { ...c.stats, ...p } } : c))

  const totalMedias = mediasTotal(cfg)

  // Ao tentar fechar (X ou clique fora), confirma — já que tudo foi salvo automaticamente.
  const requestClose = () => setConfirmClose(true)

  const previewData = buildPreviewData({ name, handle, avatar: avatarUrl, config: cfg, modelId: model.id })

  return (
    <EditorShell
      title={`Configurar ${model.name}`}
      description="Edite e veja o resultado ao vivo no celular ao lado. Tudo é salvo automaticamente."
      status={status}
      onClose={requestClose}
      preview={<PhonePreview data={previewData} />}
    >
        <Tabs defaultValue="perfil" className="flex flex-col">
          <TabsList className="flex h-auto w-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              ["perfil", "Perfil"],
              ["stats", "Estatísticas"],
              ["redes", "Redes"],
              ["pixel", "Pixel"],
              ["posts", "Postagens"],
              ["midias", "Mídias"],
            ].map(([v, l]) => (
              <TabsTrigger
                key={v}
                value={v}
                className="skeu-tab h-auto flex-none rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="pt-4">
            {/* PERFIL */}
            <TabsContent value="perfil" className="mt-0 flex flex-col gap-4">
              <ImageUpload
                modelId={model.id}
                url={cfg.coverUrl}
                onChange={(u) => patch({ coverUrl: u })}
                label="Capa / banner"
                aspect="aspect-[3/1]"
              />
              <div className="max-w-[160px]">
                <ImageUpload
                  modelId={model.id}
                  url={avatarUrl}
                  onChange={setAvatarUrl}
                  label="Foto de perfil"
                  aspect="aspect-square"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cfg-name">Nome</Label>
                  <Input id="cfg-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cfg-handle">@username</Label>
                  <Input id="cfg-handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
                </div>
              </div>
              <div className="skeu-inset flex items-center justify-between px-3 py-2.5">
                <span className="text-sm font-medium">Selo de verificado</span>
                <Switch checked={cfg.verified} onCheckedChange={(v) => patch({ verified: v })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cfg-bio">Descrição</Label>
                <Textarea
                  id="cfg-bio"
                  rows={5}
                  value={cfg.bio}
                  onChange={(e) => patch({ bio: e.target.value })}
                  placeholder="Texto que aparece abaixo do nome..."
                />
              </div>
            </TabsContent>

            {/* ESTATÍSTICAS */}
            <TabsContent value="stats" className="mt-0 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Fotos</Label>
                  <NumberInput
                    key={`photos-${model.id}`}
                    value={cfg.stats.photos}
                    onChange={(n) => patchStats({ photos: n })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Vídeos</Label>
                  <NumberInput
                    key={`videos-${model.id}`}
                    value={cfg.stats.videos}
                    onChange={(n) => patchStats({ videos: n })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Bloqueados (cadeado)</Label>
                  <NumberInput
                    key={`locked-${model.id}`}
                    value={cfg.stats.locked}
                    onChange={(n) => patchStats({ locked: n })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Curtidas (texto)</Label>
                  <Input
                    value={cfg.stats.likes}
                    onChange={(e) => patchStats({ likes: e.target.value })}
                    placeholder="Ex: 317.4K"
                  />
                </div>
              </div>
              <div className="skeu-inset-orange px-3 py-2.5 text-xs text-[#0b0b0b]/70">
                O número de <strong>Mídias</strong> é calculado automaticamente (fotos + vídeos) para manter os números
                lineares. Atualmente: <strong>{totalMedias} mídias</strong>.
              </div>
            </TabsContent>

            {/* REDES */}
            <TabsContent value="redes" className="mt-0 flex flex-col gap-4">
              <p className="text-xs text-[#0b0b0b]/60">
                O botão de cada rede aparece na página da modelo assim que você <strong>ativar o switch</strong>. Com o
                link preenchido, ao clicar a pessoa é redirecionada para o site. Sem link, o botão apenas{" "}
                <strong>arrasta a página para o topo</strong>. Desativado, o botão <strong>não aparece</strong>.
              </p>
              {(["instagram", "twitter", "tiktok"] as const).map((key) => {
                const s = cfg.socials[key]
                const active = !s.disabled
                const willShow = active
                const hasLink = !!s.url.trim()
                return (
                  <div key={key} className="skeu-inset flex flex-col gap-2 p-3">
                    <div className="flex items-center justify-between">
                      <Label className="capitalize">{key}</Label>
                      <label className="flex items-center gap-2 text-xs text-[#0b0b0b]/60">
                        Ativar
                        <Switch
                          checked={active}
                          onCheckedChange={(v) =>
                            patch({ socials: { ...cfg.socials, [key]: { ...s, disabled: !v } } })
                          }
                        />
                      </label>
                    </div>
                    <Input
                      value={s.url}
                      disabled={!active}
                      onChange={(e) => patch({ socials: { ...cfg.socials, [key]: { ...s, url: e.target.value } } })}
                      placeholder={active ? `Link do ${key} (opcional)` : "Ative o switch para preencher o link"}
                    />
                    {/* Aviso do estado atual do botão */}
                    {willShow ? (
                      <span className="text-[11px] font-medium text-green-600">
                        {hasLink ? "Aparece na página — redireciona para o link" : "Aparece na página — arrasta para o topo"}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#0b0b0b]/45">Desativado — o botão não aparece</span>
                    )}
                  </div>
                )
              })}
            </TabsContent>

            {/* PIXEL */}
            <TabsContent value="pixel" className="mt-0 flex flex-col gap-5">
              <p className="text-xs text-[#0b0b0b]/60">
                Configure os pixels de rastreamento desta página. Basta colar o <strong>ID</strong> — os scripts são
                injetados automaticamente na página pública da modelo. Deixe em branco para não usar.
              </p>

              {/* Meta Pixel */}
              <div className="skeu-inset flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-[#1877F2]">
                    <img 
                      src="/images/facebook-logo.png" 
                      alt="Facebook" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Label htmlFor="cfg-fb" className="text-sm font-semibold">
                    Meta Pixel (Facebook)
                  </Label>
                </div>
                <Input
                  id="cfg-fb"
                  value={fb}
                  onChange={(e) => setFb(e.target.value)}
                  placeholder="Ex: 1234567890123456"
                  inputMode="numeric"
                />
                <p className="text-xs text-[#0b0b0b]/50">
                  Cole o <strong>ID do Pixel</strong> do seu Gerenciador de Eventos da Meta. Dispara{" "}
                  <code className="rounded bg-[#0b0b0b]/5 px-1">PageView</code> automaticamente.
                </p>
              </div>

              {/* Utmify */}
              <div className="skeu-inset flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-[#1a1f2e]">
                    <img 
                      src="/images/utmify-logo.png" 
                      alt="Utmify" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Label htmlFor="cfg-utm" className="text-sm font-semibold">
                    Utmify
                  </Label>
                </div>
                <Input
                  id="cfg-utm"
                  value={utm}
                  onChange={(e) => setUtm(e.target.value)}
                  placeholder="Ex: 67890abcdef1234567890abc"
                />
                <p className="text-xs text-[#0b0b0b]/50">
                  Cole o seu <strong>pixelId (window.pixelId)</strong> da Utmify. Carrega o script de UTMs e o pixel
                  da Utmify automaticamente.
                </p>
              </div>

              <div className="skeu-inset-orange px-3 py-2.5 text-xs leading-relaxed text-[#0b0b0b]/70">
                Os pixels só são carregados na <strong>página pública</strong> (o que o visitante vê), nunca no
                painel. Mudanças entram em vigor assim que você salvar.
              </div>
            </TabsContent>

            {/* POSTAGENS */}
            <TabsContent value="posts" className="mt-0 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Número de postagens (exibido na aba)</Label>
                <NumberInput
                  key={`posts-${model.id}`}
                  value={cfg.postsCount}
                  onChange={(n) => patch({ postsCount: n })}
                />
              </div>
              <p className="text-xs text-[#0b0b0b]/60">
                Cada postagem usa a foto enviada + nome e @username do perfil.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {cfg.posts.map((post, i) => (
                  <div key={post.id} className="flex flex-col gap-1.5">
                    <div className="relative">
                      {post.url ? (
                        <>
                          {/* Preview: com blur mostra cadeado + stats, sem blur mostra só foto */}
                          {post.blur ? (
                            <div className="aspect-square w-full rounded-lg bg-[#f4efe8] relative overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={post.url || "/placeholder.svg"} 
                                alt="" 
                                className="absolute inset-0 h-full w-full object-cover blur-md scale-110" 
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="z-10 flex flex-col items-center gap-2">
                                  <Lock className="w-6 h-6 text-[#64748b]" weight="regular" />
                                  <div className="flex items-center gap-2 text-[#64748b] text-[10px] font-medium">
                                    <span>{post.imagesCount ?? 652}</span>
                                    <span>{post.videosCount ?? 444}</span>
                                    <span>{post.likes ?? "317K"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={post.url || "/placeholder.svg"} alt="" className="aspect-square w-full rounded-lg object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => patch({ posts: cfg.posts.filter((p) => p.id !== post.id) })}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                            aria-label="Remover postagem"
                          >
                            <X className="h-3 w-3" weight="bold" />
                          </button>
                        </>
                      ) : (
                        <AddImageTile
                          modelId={model.id}
                          onAdd={(url) => patch({ posts: cfg.posts.map((p, idx) => idx === i ? { ...p, url } : p) })}
                        />
                      )}
                    </div>
                    {post.url && (
                      <label className="flex items-center justify-between rounded-md border border-[#0b0b0b]/10 px-2 py-1 text-[11px]">
                        Blur
                        <Switch
                          checked={post.blur ?? false}
                          onCheckedChange={(v) =>
                            patch({ posts: cfg.posts.map((p, idx) => (idx === i ? { ...p, blur: v } : p)) })
                          }
                        />
                      </label>
                    )}
                  </div>
                ))}
                <AddImageTile
                  modelId={model.id}
                  onAdd={(url) => patch({ posts: [...cfg.posts, { id: `post${Date.now()}`, url, blur: true }] })}
                />
              </div>
            </TabsContent>

            {/* MÍDIAS */}
            <TabsContent value="midias" className="mt-0 flex flex-col gap-4">
              {/* Seletor de tamanho do grid */}
              <div className="flex flex-col gap-2">
                <Label>Tamanho do grid</Label>
                <div className="flex flex-wrap gap-2">
                  {GRID_SIZES.map((size) => {
                    const active = cfg.gridSize === size
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setCfg((c) =>
                            c ? { ...c, gridSize: size as GridSize, medias: resizeMedias(c.medias, size) } : c,
                          )
                        }
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                          active ? "skeu-pill-active" : "skeu-pill"
                        }`}
                      >
                        {size} mídias
                      </button>
                    )
                  })}
                </div>
              </div>

              <p className="text-xs text-[#0b0b0b]/60">
                Clique em um bloco para enviar/trocar a foto daquela posição. As fotos aparecem no grid da página
                alinhadas à esquerda, na mesma ordem dos blocos. Com blur ativo a imagem fica borrada e com cadeado.
              </p>

              {/* Grid de blocos posicionados */}
              <div className="grid grid-cols-3 gap-2">
                {cfg.medias.map((m, i) => (
                  <div key={m.id} className="flex flex-col gap-1.5">
                    <MediaSlot
                      modelId={model.id}
                      item={m}
                      index={i}
                      onUpload={(url) =>
                        patch({ medias: cfg.medias.map((x, idx) => (idx === i ? { ...x, url } : x)) })
                      }
                      onClear={() =>
                        patch({ medias: cfg.medias.map((x, idx) => (idx === i ? { ...x, url: "", blur: true } : x)) })
                      }
                    />
                    {m.url && (
                      <label className="flex items-center justify-between rounded-md border border-[#0b0b0b]/10 px-2 py-1 text-[11px]">
                        Blur
                        <Switch
                          checked={m.blur}
                          onCheckedChange={(v) =>
                            patch({ medias: cfg.medias.map((x, idx) => (idx === i ? { ...x, blur: v } : x)) })
                          }
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Popup de confirmação ao fechar */}
        {confirmClose && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6">
            <div className="skeu-panel w-full max-w-sm p-5">
              <h3 className="skeu-emboss text-base font-bold text-[#0b0b0b]">Tudo foi salvo automaticamente</h3>
              <p className="mt-1.5 text-sm text-[#0b0b0b]/60">
                Suas alterações já estão salvas. Deseja continuar editando ou fechar?
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setConfirmClose(false)} className="skeu-btn px-4 py-2 text-sm font-semibold">
                  Continuar editando
                </button>
                <button
                  onClick={() => {
                    setConfirmClose(false)
                    onClose()
                  }}
                  className="skeu-btn-primary px-4 py-2 text-sm font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
    </EditorShell>
  )
}

// Campo numérico que permite apagar o conteúdo (inclusive o zero) enquanto digita.
// Use uma `key` ligada à modelo para reinicializar ao trocar de modelo.
function NumberInput({
  value,
  onChange,
  className,
  emptyValue = 0,
}: {
  value: number
  onChange: (n: number) => void
  className?: string
  emptyValue?: number
}) {
  const [text, setText] = useState(String(value))
  return (
    <Input
      type="text"
      inputMode="numeric"
      className={className}
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "")
        setText(raw)
        onChange(raw === "" ? emptyValue : Number(raw))
      }}
    />
  )
}

// Tile de adicionar imagem (faz upload e devolve a URL).
function AddImageTile({ modelId, onAdd }: { modelId: string; onAdd: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const url = await uploadModelImage(modelId, file)
      onAdd(url)
    } catch (err) {
      console.log("[v0] erro no upload:", err)
      alert("Falha no upload. Verifique se o bucket 'model-media' existe no Supabase.")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={loading}
      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#0b0b0b]/25 bg-[#fff8eb] text-[#0b0b0b]/40 hover:border-[#f56708]/50 hover:text-[#f56708]"
    >
      {loading ? <CircleNotch className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" weight="bold" />}
      <span className="text-[11px]">Enviar</span>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </button>
  )
}

// Bloco posicionado do grid de mídias: clica para enviar/trocar a foto daquela posição.
function MediaSlot({
  modelId,
  item,
  index,
  onUpload,
  onClear,
}: {
  modelId: string
  item: MediaItem
  index: number
  onUpload: (url: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const url = await uploadModelImage(modelId, file)
      onUpload(url)
    } catch (err) {
      console.log("[v0] erro no upload:", err)
      alert("Falha no upload. Verifique se o bucket 'model-media' existe no Supabase.")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border ${
          item.url
            ? "border-[#0b0b0b]/10"
            : "border-dashed border-[#0b0b0b]/25 bg-[#fff8eb] text-[#0b0b0b]/40 hover:border-[#f56708]/50 hover:text-[#f56708]"
        }`}
        aria-label={item.url ? `Trocar mídia da posição ${index + 1}` : `Adicionar mídia na posição ${index + 1}`}
      >
        {item.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url || "/placeholder.svg"}
            alt=""
            className={`h-full w-full object-cover ${item.blur ? "blur-sm" : ""}`}
          />
        ) : loading ? (
          <CircleNotch className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" weight="bold" />
        )}
        {loading && item.url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <CircleNotch className="h-5 w-5 animate-spin" />
          </div>
        )}
      </button>

      {/* Número da posição */}
      <span className="absolute left-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {index + 1}
      </span>

      {/* Remover (só quando há foto) */}
      {item.url && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
          aria-label={`Remover mídia da posição ${index + 1}`}
        >
          <X className="h-3 w-3" weight="bold" />
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}
