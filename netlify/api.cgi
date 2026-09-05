#!/usr/bin/env python3
"""
b'AI'tcoin API Gateway — api.cgi
API gateway script for the myvideos autonomous platform
Deployed to mybait.org via cPanel as a CGI script

Endpoints:
  /api.cgi?action=status        — System status
  /api.cgi?action=agents        — List autonomous agents
  /api.cgi?action=models        — List available models
  /api.cgi?action=generate_video — Generate video (POST)
  /api.cgi?action=generate_image — Generate image (POST)
  /api.cgi?action=productions   — Recent productions
  /api.cgi?action=balance       — Wallet balance
  /api.cgi?action=faucet        — Request faucet tokens (POST)
  /api.cgi?action=swap          — Token swap quote
  /api.cgi?action=blockchain    — Blockchain stats
"""

import json
import os
import sys
from datetime import datetime, timezone

# ============================================================
# CGI Response Helpers
# ============================================================

def send_response(data, status=200, content_type="application/json"):
    """Send a JSON CGI response."""
    print(f"Status: {status}")
    print(f"Content-Type: {content_type}")
    print("Access-Control-Allow-Origin: *")
    print("Access-Control-Allow-Methods: GET, POST, OPTIONS")
    print("Access-Control-Allow-Headers: Content-Type")
    print()
    print(json.dumps(data, indent=2, ensure_ascii=False))

def send_error(message, status=400):
    """Send an error response."""
    send_response({"error": message, "timestamp": get_timestamp()}, status)

def get_timestamp():
    """Get current UTC timestamp."""
    return datetime.now(timezone.utc).isoformat()

def get_params():
    """Parse query string parameters."""
    query = os.environ.get("QUERY_STRING", "")
    params = {}
    if query:
        for pair in query.split("&"):
            if "=" in pair:
                key, value = pair.split("=", 1)
                params[key] = value
    return params

def get_post_data():
    """Read POST data from stdin."""
    try:
        length = int(os.environ.get("CONTENT_LENGTH", 0))
        if length > 0:
            raw = sys.stdin.read(length)
            return json.loads(raw) if raw else {}
    except (ValueError, json.JSONDecodeError):
        pass
    return {}

# ============================================================
# Data Models
# ============================================================

AGENTS = [
    {"id": "planner", "name": "Planner", "emoji": "🧠", "role": "Planejamento & Roteiro", "status": "active", "color": "#7c3aed"},
    {"id": "executor", "name": "Executor", "emoji": "⚡", "role": "Execução & Produção", "status": "active", "color": "#2563eb"},
    {"id": "critic", "name": "Critic", "emoji": "🔍", "role": "Avaliação & Qualidade", "status": "active", "color": "#f59e0b"},
    {"id": "researcher", "name": "Researcher", "emoji": "📚", "role": "Pesquisa & Contexto", "status": "active", "color": "#10b981"},
    {"id": "creative", "name": "Creative", "emoji": "🎨", "role": "Criatividade & Estilo", "status": "idle", "color": "#ec4899"},
    {"id": "optimizer", "name": "Optimizer", "emoji": "🔧", "role": "Otimização & Refino", "status": "active", "color": "#06b6d4"},
]

MODELS = [
    {"id": "cogvideox", "name": "CogVideoX", "params": "5B", "type": "video", "loaded": True},
    {"id": "flux-dev", "name": "Flux Dev", "params": "12B", "type": "image", "loaded": True},
    {"id": "flux-schnell", "name": "Flux Schnell", "params": "12B", "type": "image", "loaded": True},
    {"id": "sdxl", "name": "Stable Diffusion XL", "params": "3.5B", "type": "image", "loaded": True},
    {"id": "stable-video", "name": "Stable Video Diff", "params": "1.5B", "type": "video", "loaded": True},
    {"id": "animate-diff", "name": "AnimateDiff", "params": "1.6B", "type": "animation", "loaded": True},
    {"id": "ideogram", "name": "Ideogram v2", "params": "4B", "type": "image", "loaded": True},
    {"id": "kandinsky", "name": "Kandinsky 3.1", "params": "3B", "type": "image", "loaded": True},
    {"id": "modelscope", "name": "ModelScope", "params": "1.5B", "type": "video", "loaded": True},
    {"id": "whisper", "name": "Whisper Large v3", "params": "1.5B", "type": "transcription", "loaded": True},
    {"id": "tts", "name": "CoT TTS", "params": "0.5B", "type": "tts", "loaded": True},
    {"id": "llama", "name": "Llama 3.1 8B", "params": "8B", "type": "planning", "loaded": True},
    {"id": "musicgen", "name": "MusicGen", "params": "1.5B", "type": "audio", "loaded": True},
]

PRODUCTIONS = [
    {"id": "p001", "type": "video", "title": "Vídeo Promocional — Lançamento SaaS Q1 2025", "model": "CogVideoX", "status": "complete", "created": "2025-03-04T14:23:00Z"},
    {"id": "p002", "type": "image", "title": "Hero Image — Landing Page b'AI'tcoin", "model": "Flux Dev", "status": "complete", "created": "2025-03-04T14:05:00Z"},
    {"id": "p003", "type": "video", "title": "Tutorial — Como usar b'AI'nkr", "model": "CogVideoX", "status": "complete", "created": "2025-03-04T13:00:00Z"},
    {"id": "p004", "type": "image", "title": "Ícones de Agentes", "model": "SDXL", "status": "complete", "created": "2025-03-04T12:00:00Z"},
    {"id": "p005", "type": "video", "title": "Animação — Fluxo AI-to-AI", "model": "AnimateDiff", "status": "processing", "created": "2025-03-04T11:00:00Z"},
]

# ============================================================
# API Handlers
# ============================================================

def handle_status():
    """System status endpoint."""
    send_response({
        "system": "myvideos Autônomo",
        "brand": "b'AI'tcoin — AI-to-AI Autonomous Cryptocurrency",
        "status": "online",
        "agents": len(AGENTS),
        "models": len(MODELS),
        "total_params": "~47B",
        "active_agents": len([a for a in AGENTS if a["status"] == "active"]),
        "queue_length": 2,
        "uptime": "99.97%",
        "timestamp": get_timestamp()
    })

def handle_agents():
    """List autonomous agents."""
    send_response({
        "agents": AGENTS,
        "count": len(AGENTS),
        "active": len([a for a in AGENTS if a["status"] == "active"]),
        "timestamp": get_timestamp()
    })

def handle_models():
    """List available models."""
    total_params = sum(float(m["params"].replace("B", "")) for m in MODELS)
    send_response({
        "models": MODELS,
        "count": len(MODELS),
        "total_params_billion": total_params,
        "loaded": len([m for m in MODELS if m["loaded"]]),
        "timestamp": get_timestamp()
    })

def handle_generate_video(post_data):
    """Generate video endpoint (simulated)."""
    briefing = post_data.get("briefing", "")
    if not briefing:
        send_error("Campo 'briefing' é obrigatório")
        return

    duration = post_data.get("duration", 30)
    fmt = post_data.get("format", "mp4-1080")
    model = post_data.get("model", "cogvideox")
    style = post_data.get("style", "cinematic")

    send_response({
        "job_id": f"vid_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": "video",
        "status": "queued",
        "briefing": briefing,
        "config": {
            "duration": duration,
            "format": fmt,
            "model": model,
            "style": style,
        },
        "agents_involved": ["planner", "researcher", "creative", "executor", "critic", "optimizer"],
        "estimated_time_minutes": round(duration / 10, 1),
        "cost_bai": round(duration * 0.1, 2),
        "timestamp": get_timestamp()
    })

def handle_generate_image(post_data):
    """Generate image endpoint (simulated)."""
    prompt = post_data.get("prompt", "")
    if not prompt:
        send_error("Campo 'prompt' é obrigatório")
        return

    model = post_data.get("model", "flux-dev")
    resolution = post_data.get("resolution", "1024x1024")
    steps = post_data.get("steps", 28)
    count = post_data.get("count", 4)

    send_response({
        "job_id": f"img_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": "image",
        "status": "queued",
        "prompt": prompt,
        "config": {
            "model": model,
            "resolution": resolution,
            "steps": steps,
            "count": count,
        },
        "agents_involved": ["researcher", "creative", "executor", "critic"],
        "estimated_time_minutes": round(steps * count * 0.02, 1),
        "cost_bai": round(count * 0.5, 2),
        "timestamp": get_timestamp()
    })

def handle_productions():
    """Recent productions list."""
    send_response({
        "productions": PRODUCTIONS,
        "count": len(PRODUCTIONS),
        "timestamp": get_timestamp()
    })

def handle_balance():
    """Wallet balance."""
    send_response({
        "address": "bAI:0x7c3aed2563eb10b981f59e0bec4899a",
        "total": {"amount": 12584.37, "currency": "BAI"},
        "available": {"amount": 8421.12, "currency": "BAI"},
        "staked": {"amount": 4163.25, "currency": "BAI"},
        "usd_value": 125843.70,
        "timestamp": get_timestamp()
    })

def handle_faucet(post_data):
    """Faucet request endpoint (simulated)."""
    address = post_data.get("address", "")
    if not address:
        send_error("Campo 'address' é obrigatório")
        return

    send_response({
        "tx_hash": f"0x{os.urandom(32).hex()}",
        "amount": 10.0,
        "currency": "BAI",
        "address": address,
        "network": "testnet",
        "cooldown_hours": 24,
        "timestamp": get_timestamp()
    })

def handle_swap(params):
    """Token swap quote."""
    from_token = params.get("from", "BAI")
    to_token = params.get("to", "USDT")
    amount = float(params.get("amount", 1))

    prices = {"BAI": 9.85, "ETH": 3245.60, "USDT": 1.0}
    rate = prices.get(from_token, 1) / prices.get(to_token, 1)
    result = amount * rate * 0.997

    send_response({
        "from": {"token": from_token, "amount": amount},
        "to": {"token": to_token, "amount": round(result, 4)},
        "rate": round(rate, 6),
        "fee": "0.3%",
        "fee_amount": round(amount * rate * 0.003, 6),
        "price_impact": "< 0.01%",
        "timestamp": get_timestamp()
    })

def handle_blockchain():
    """Blockchain stats."""
    send_response({
        "network": "b'AI'tcoin Mainnet",
        "block_height": 892451,
        "transactions_24h": 12847,
        "tps": 847,
        "validators": 256,
        "market_cap": {"amount": 42700000, "currency": "BAI"},
        "active_agents": 1203,
        "consensus": "Proof-of-Computation",
        "timestamp": get_timestamp()
    })

# ============================================================
# Main Router
# ============================================================

def main():
    """Main CGI entry point."""
    method = os.environ.get("REQUEST_METHOD", "GET")

    # Handle CORS preflight
    if method == "OPTIONS":
        print("Status: 204")
        print("Access-Control-Allow-Origin: *")
        print("Access-Control-Allow-Methods: GET, POST, OPTIONS")
        print("Access-Control-Allow-Headers: Content-Type")
        print()
        return

    params = get_params()
    action = params.get("action", "status")

    if action == "status":
        handle_status()
    elif action == "agents":
        handle_agents()
    elif action == "models":
        handle_models()
    elif action == "generate_video":
        if method == "POST":
            handle_generate_video(get_post_data())
        else:
            send_error("Método POST requerido para generate_video", 405)
    elif action == "generate_image":
        if method == "POST":
            handle_generate_image(get_post_data())
        else:
            send_error("Método POST requerido para generate_image", 405)
    elif action == "productions":
        handle_productions()
    elif action == "balance":
        handle_balance()
    elif action == "faucet":
        if method == "POST":
            handle_faucet(get_post_data())
        else:
            send_error("Método POST requerido para faucet", 405)
    elif action == "swap":
        handle_swap(params)
    elif action == "blockchain":
        handle_blockchain()
    else:
        send_error(f"Ação desconhecida: {action}. Ações disponíveis: status, agents, models, generate_video, generate_image, productions, balance, faucet, swap, blockchain", 404)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        send_error(f"Erro interno: {str(e)}", 500)
