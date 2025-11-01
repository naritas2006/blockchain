const validators = ['0xAccount1', '0xAccount2', '0xAccount3'];

function selectValidator() {
  const idx = Math.floor(Math.random() * validators.length);
  return validators[idx];
}

module.exports = { selectValidator, validators };
