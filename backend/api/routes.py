import logging

from fastapi import APIRouter, Response
from schemas.models import GenerateRequest # Assuming your Pydantic models are here
from services.text import generate_text
from services.threed import generate_3d
from services.quiz import generate_quiz
from services.video import generate_video
from services.falcon import expand_prompt 

from cards.dijkastraAlgo import get_dijkstra_content
from cards.astarAlgo import get_astar_content
from cards.greedyAlgo import get_greedy_content
from cards.Solar import get_solar_content
from cards.Blackhole import get_blackhole_content

router = APIRouter()
logger = logging.getLogger(__name__)


@router.options("/generate")
async def generate_options() -> Response:
    return Response(status_code=204)


def _fallback_response(context_type: str, error_message: str) -> dict:
    response = {
        "text_explanation": "I couldn't reach the generation service right now. Please try again in a moment.",
        "media_type": context_type or "Text",
        "error": error_message,
    }

    if context_type == "3D_simulation":
        response["canvas_code"] = None
    elif context_type == "Quiz":
        response["quiz_data"] = []
    elif context_type == "Video":
        response["video_url"] = None

    return response

@router.post("/generate")
async def generate_content(request: GenerateRequest):
    try:
        # ROUTE 1: SIMPLE TEXT (Fast, Direct)
        if request.context_type == "Text" or not request.context_type:
            return await generate_text(request.prompt, request.model_choice)
  
        detailed_blueprint = await expand_prompt(request.prompt, request.history, request.context_type, request.architect_choice)

        # Step 2: Gemini executes the complex blueprint
        if request.context_type == "3D_simulation":
            return await generate_3d(detailed_blueprint, request.history)

        if request.context_type == "Quiz":
            return await generate_quiz(detailed_blueprint, request.history)

        if request.context_type == "Video":
            return await generate_video(detailed_blueprint, request.history)

        return {
            "text_explanation": "The selected context type is not supported.",
            "media_type": request.context_type,
            "error": "Invalid context type",
        }
    except Exception as exc:
        logger.exception("Generation pipeline failed for context_type=%s", request.context_type)
        return _fallback_response(request.context_type, str(exc))

@router.get("/cards/{topic_id}")
async def get_card_content(topic_id: str):
    cards_map = {
        "dijkstra": get_dijkstra_content,
        "a-star": get_astar_content,
        "greedy": get_greedy_content,
        "solar-system": get_solar_content,
        "blackhole": get_blackhole_content
    }
    if topic_id in cards_map:
        return cards_map[topic_id]()
    return {"error": "Topic not found", "text_explanation": "Content not found for this topic.", "media_type": "Text"}