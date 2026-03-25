import os
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)

app = FastAPI(title="Kiran Inference Server")

MODEL_PATH = os.getenv("KIRAN_MODEL_PATH", "/app/Kiran2.0-Model")

# Singleton loading at startup
model = None
tokenizer = None

@app.on_event("startup")
def load_model():
    global model, tokenizer
    logger.info(f"Loading model from {MODEL_PATH}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        
        # Determine dtype based on CUDA availability
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            device_map="auto",
            torch_dtype=dtype,
            # load_in_4bit=True, # Uncomment to save more memory
            # bnb_4bit_compute_dtype=torch.float16,
        )
        logger.info(f"Model loaded successfully with dtype: {dtype}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")

class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: str = "You are an AI assistant that evaluates a student's concept flow graph for an educational exercise."
    max_new_tokens: int = 1024
    repetition_penalty: float = 1.1

@app.post("/generate")
async def generate(request: GenerateRequest):
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        messages = [
            {"role": "system", "content": request.system_prompt},
            {"role": "user", "content": request.prompt}
        ]
        logger.info(f"Messages: {messages}")
        tokenized_prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        inputs = tokenizer(
            tokenized_prompt, 
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=3084
        ).to(device)
        input_len = inputs["input_ids"].shape[1]
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_new_tokens,
                use_cache=True,
                do_sample=False,
                repetition_penalty=request.repetition_penalty,
                eos_token_id=tokenizer.eos_token_id,
                pad_token_id=tokenizer.eos_token_id,
                num_beams=1,
                early_stopping=True,
            )
        logger.info(f"Outputs: {outputs}")
        response = tokenizer.decode(outputs[0][input_len:], skip_special_tokens=True)
        return {"response": response}
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok" if model is not None else "loading"}
