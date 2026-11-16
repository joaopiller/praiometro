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
            if len(self._eventos) > 5000:
                # quem não aparece há mais de uma janela não precisa ficar na memória
                for antiga in [c for c, f in self._eventos.items() if agora - f[-1] > self.janela]:
                    del self._eventos[antiga]
            fila = self._eventos[chave]
            while fila and agora - fila[0] > self.janela:
                fila.popleft()
            if len(fila) >= self.maximo:
                return False
            fila.append(agora)
            return True
