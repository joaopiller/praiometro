import threading
import time
from collections import defaultdict, deque


class LimitadorTaxa:
    """Janela deslizante em memória (vale para uma instância só)."""

    def __init__(self, maximo: int, janela_segundos: float = 60.0):
        self.maximo = maximo
        self.janela = janela_segundos
        self._eventos: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def permitir(self, chave: str) -> bool:
        agora = time.monotonic()
        with self._lock:
            fila = self._eventos[chave]
            while fila and agora - fila[0] > self.janela:
                fila.popleft()
            if len(fila) >= self.maximo:
                return False
            fila.append(agora)
            return True
