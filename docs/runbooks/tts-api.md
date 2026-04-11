# API interna de TTS

## Objetivo

Gerar audio natural em `pt-BR` para uso no bot do WhatsApp sem depender de credito da OpenAI, ElevenLabs ou Google Translate TTS.

O backend expõe uma rota interna que recebe texto e devolve um arquivo `audio/ogg` com codec `opus`, pronto para envio via `voice: true` no WhatsApp Cloud API.

## Endpoint

- `POST /api/tts/voice-note`

## Autenticacao

A rota usa o mesmo token interno do bot:

- header `Authorization: Bearer <BOT_API_TOKEN>`

Tambem aceita:

- header `x-bot-token: <BOT_API_TOKEN>`

## Request

### Headers

```http
Content-Type: application/json
Authorization: Bearer <BOT_API_TOKEN>
```

### Body

```json
{
  "text": "Ola! Como posso ajudar?"
}
```

### Regras

- `text` e obrigatorio
- o texto e sanitizado antes da sintese
- limite atual: `1200` caracteres

## Response

### Sucesso

Status:

- `200 OK`

Headers:

```http
Content-Type: audio/ogg
Content-Disposition: inline; filename="voice-note.ogg"
```

Body:

- binario `.ogg` com `opus`, mono e bitrate leve para WhatsApp

### Erros comuns

- `400` payload invalido ou texto vazio
- `401` token interno ausente ou invalido
- `502` falha na geracao ou conversao do audio
- `504` timeout na sintese ou na conversao

Exemplo de erro:

```json
{
  "message": "Nao foi possivel gerar o audio agora."
}
```

## Voz e conversao

Configuracao atual:

- voz: `pt-BR-FranciscaNeural`
- formato intermediario: `mp3`
- formato final: `ogg`
- codec final: `libopus`
- canais: `mono`
- bitrate: `24k`

## Fluxo interno

1. valida o body
2. sanitiza o texto
3. gera mp3 temporario com Edge TTS
4. converte para `ogg/opus` com `ffmpeg`
5. carrega o arquivo final em memoria
6. remove temporarios
7. responde o binario ao cliente

## Exemplo com curl

```bash
curl -X POST "http://localhost:3001/api/tts/voice-note" \
  -H "Authorization: Bearer SEU_BOT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Ola! Como posso ajudar?\"}" \
  --output voice-note.ogg
```

## Exemplo de uso no n8n

Fluxo sugerido:

1. `HTTP Request`
   - metodo: `POST`
   - url: `{{ $env.BACKEND_BASE_URL }}/api/tts/voice-note`
   - response format: `File`
   - send body as JSON
   - header `Authorization: Bearer {{ $env.BOT_API_TOKEN }}`
   - body:

```json
{
  "text": "={{ $json.replyText }}"
}
```

2. `HTTP Request` para WhatsApp Cloud API
   - enviar o binario retornado como audio
   - marcar como `voice note`

## Logs operacionais

Logs resumidos emitidos pelo backend:

```txt
[tts] voice note requested { length: 48, voice: 'pt-BR-FranciscaNeural' }
[tts] voice note generated { bytes: 10849 }
```

Em caso de falha:

```txt
[tts] edge synthesis failed.
[tts] ogg conversion failed.
```

## Observacao tecnica

A implementacao atual usa Edge TTS do lado do backend e entrega o contrato final que o `n8n` precisa:

- entrada em texto
- saida `audio/ogg`
- pronto para WhatsApp

Se o fluxo exigir resiliencia maior, o proximo passo recomendado e adicionar:

- retry controlado
- cache por texto curto
- request id nos logs
