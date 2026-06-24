// AquaOps — Pure helper functions (no React dependencies)

function calcHoras(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const [h1,m1] = checkIn.split(":").map(Number);
  const [h2,m2] = checkOut.split(":").map(Number);
  const mins = (h2*60+m2) - (h1*60+m1);
  if (mins <= 0) return null;
  return (mins/60).toFixed(1);
}

export { calcHoras };
