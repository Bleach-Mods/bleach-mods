# 卍 bleach-mods

Mods de [Claude Code](https://claude.com/claude-code) inspirados en **Bleach**.

## bankai

Cada vez que Claude termina una tarea con éxito, libera un **Bankai** al azar, con una animación propia en la terminal.

```
  "Katsu tame ni tatakau n ja nai. Mamoru tame ni tatakau n da."
       ██████╗  █████╗ ███╗   ██╗        ██╗  ██╗ █████╗ ██╗
       ██╔══██╗██╔══██╗████╗  ██║        ██║ ██╔╝██╔══██╗██║
       ██████╔╝███████║██╔██╗ ██║ █████╗ █████╔╝ ███████║██║
       ██╔══██╗██╔══██║██║╚██╗██║ ╚════╝ ██╔═██╗ ██╔══██║██║
       ██████╔╝██║  ██║██║ ╚████║        ██║  ██╗██║  ██║██║
       ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝        ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
  卍 Bankai ─ Tensa Zangetsu  · Kurosaki Ichigo
```

### Qué hace

- **20 bankais, cada uno con su firma.** La frase del personaje (en japonés, romanizada) se tipea, el reiatsu tiembla y llega el efecto de cada uno:
  - el Getsuga Tenshō de Ichigo;
  - los mil pétalos de Byakuya;
  - las flores de hielo de Hitsugaya;
  - el telón de Shunsui;
  - el mundo al revés de Shinji;
  - y así con los demás.

  Después, un destello y un brillo que cruza el banner una sola vez.
- **Un secreto.** Algo distinto pasa cuando una batalla dura demasiado...
- **Colección.** `/bankai` muestra cuáles liberaste. Se guarda entre sesiones.
- **Hollowificación.** A medida que se llena el contexto aparece una barra de reiatsu y la máscara de Ichigo se va formando:

  | Contexto usado | Qué aparece |
  |---|---|
  | 50% | Reiatsu inestable |
  | 70% | Media máscara |
  | 85% | Máscara completa |
  | 95% | Vasto Lorde |

  Cuando el contexto se compacta, la máscara se rompe.
- **Sonido opcional.** Un "shiiing" de espada al liberar el bankai. Viene apagado; se activa en `/config` → *Sonido del corte*.

Todo se dibuja localmente: **no consume tokens**. La única excepción es `/bankai`: Claude lee la salida del comando, así que gasta unos pocos tokens cada vez que lo usás.

### Instalar

Requiere Claude Code 2.1.287 o posterior.

```
/plugin marketplace add Bleach-Mods/bleach-mods
/plugin install bankai@bleach-mods
/reload-plugins
```

### Comandos

| Comando | Qué hace |
|---|---|
| `/bankai` | Tu colección |
| `/bankai <nombre>` | Muestra ese bankai ahora (ej. `/bankai byakuya`). No cuenta para la colección |
| `/bankai todos` | Los muestra todos seguidos |

### Notas

- La animación completa necesita una terminal de unas 70 columnas de ancho. Si es más angosta, el bankai se muestra en una sola línea.
- Para que salga un bankai, la tarea tiene que haber usado al menos una herramienta. Una respuesta de charla no cuenta.
- En Windows, el sonido se reproduce con PowerShell.

### Desarrollo

```
claude plugin validate bankai
claude plugin test bankai
```

---

*Proyecto de fans, sin fines comerciales y sin relación con Tite Kubo, Shueisha ni Viz Media. Bleach y sus personajes pertenecen a sus dueños. Las frases están escritas para este mod (salvo la de Yamamoto); el arte ASCII y el sonido son originales.*
