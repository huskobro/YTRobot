from abc import ABC, abstractmethod
from pathlib import Path


class BaseVisualsProvider(ABC):
    @abstractmethod
    def fetch(self, query: str, output_path: Path) -> Path:
        """Fetch or generate a visual for the given query and save to output_path. Returns the saved file path."""
        ...
