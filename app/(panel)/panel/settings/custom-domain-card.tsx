"use client";

import { useState, useTransition } from "react";
import { CheckCircle2Icon, ClockIcon } from "lucide-react";
import { toast } from "sonner";
import {
  removeCustomDomain,
  saveCustomDomain,
  verifyCustomDomain,
} from "@/actions/domain";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { Field, FormError } from "@/components/panel/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";

/** İşletmenin kendi alan adı (Faz 3.2). */
export function CustomDomainCard({
  domain,
  verified,
  allowed,
  dns,
}: {
  domain: string | null;
  verified: boolean;
  /** Paket özel alan adı içeriyor mu */
  allowed: boolean;
  /** Eklenecek DNS kaydı: platform alan adı varsa CNAME, yoksa sunucu IP'sine A kaydı */
  dns: { type: "CNAME" | "A"; value: string };
}) {
  const [editing, setEditing] = useState(!domain);
  const [checking, startChecking] = useTransition();
  const [checkError, setCheckError] = useState<string | null>(null);
  const { pending, error, onSubmit } = useFormAction(saveCustomDomain, () => {
    toast.success("Alan adı kaydedildi. Şimdi DNS kaydını ekleyin.");
    setEditing(false);
  });

  function check() {
    setCheckError(null);
    startChecking(async () => {
      const result = await verifyCustomDomain();
      if (result.ok) toast.success("Alan adı doğrulandı; menünüz yayında.");
      else setCheckError(result.error);
    });
  }

  if (!allowed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Özel alan adı</CardTitle>
          <CardDescription>
            Menünüzü kendi alan adınızla (ör. menu.isletmeniz.com) yayınlamak
            Pro pakette kullanılabilir. Paket yükseltmek için bizimle iletişime
            geçin.
          </CardDescription>
        </CardHeader>
        {domain && (
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>
              <span className="font-medium">{domain}</span> şu an platformdaki
              menünüze yönlendiriliyor.
            </span>
            <RemoveButton />
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Özel alan adı
          {domain &&
            (verified ? (
              <Badge className="border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                <CheckCircle2Icon />
                Yayında
              </Badge>
            ) : (
              <Badge variant="secondary">
                <ClockIcon />
                DNS bekleniyor
              </Badge>
            ))}
        </CardTitle>
        <CardDescription>
          Menünüz kendi alan adınızda açılır, ör. menu.isletmeniz.com/şube. QR
          kodlarınız da bu adresi kullanır.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {editing ? (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Field
              label="Alan adı"
              htmlFor="domain"
              hint="Genellikle bir alt alan adı kullanılır: menu.isletmeniz.com"
            >
              <Input
                id="domain"
                name="domain"
                defaultValue={domain ?? ""}
                placeholder="menu.isletmeniz.com"
                autoComplete="off"
                spellCheck={false}
                required
              />
            </Field>
            <FormError error={error} />
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Kaydediliyor…" : "Kaydet"}
              </Button>
              {domain && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Vazgeç
                </Button>
              )}
            </div>
          </form>
        ) : (
          domain && (
            <>
              <p className="text-sm">
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-medium underline-offset-4 hover:underline"
                >
                  {domain}
                </a>
              </p>
              {!verified && (
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
                  <p>
                    Alan adınızı aldığınız firmanın DNS ayarlarına şu kaydı
                    ekleyin, sonra “DNS’i kontrol et”e basın:
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
                    <dt className="text-muted-foreground">Tür</dt>
                    <dd>{dns.type}</dd>
                    <dt className="text-muted-foreground">Ad</dt>
                    <dd className="break-all">{domain}</dd>
                    <dt className="text-muted-foreground">Değer</dt>
                    <dd className="break-all">{dns.value}</dd>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    DNS değişikliğinin yayılması birkaç dakika ile birkaç saat
                    sürebilir. Doğrulanınca güvenli bağlantı (HTTPS) otomatik
                    kurulur.
                  </p>
                </div>
              )}
              <FormError error={checkError} />
              <div className="flex flex-wrap gap-2">
                {!verified && (
                  <Button type="button" disabled={checking} onClick={check}>
                    {checking ? "Kontrol ediliyor…" : "DNS’i kontrol et"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  Değiştir
                </Button>
                <RemoveButton />
              </div>
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}

function RemoveButton() {
  return (
    <ConfirmButton
      destructive
      title="Alan adı kaldırılsın mı?"
      description="Menünüz yalnızca platform adresinde açılır. Bu alan adıyla basılmış QR kodlar çalışmaz."
      confirmLabel="Kaldır"
      successMessage="Alan adı kaldırıldı."
      onConfirm={removeCustomDomain}
    >
      Kaldır
    </ConfirmButton>
  );
}
