/** "001" -> "LOCKER_001", 1 -> "LOCKER_001", "LOCKER_001" -> "LOCKER_001" */
function toMongoLockerId(id) {
  if (id == null) return id;
  const s = String(id).trim();
  return /^LOCKER_/i.test(s) ? s.toUpperCase() : `LOCKER_${s.padStart(3, '0')}`;
}

/** "LOCKER_001" -> "001", "1" -> "001" */
function toSqlIdentificador(id) {
  if (id == null) return id;
  return String(id).replace(/^LOCKER_/i, '').padStart(3, '0');
}

module.exports = { toMongoLockerId, toSqlIdentificador };
