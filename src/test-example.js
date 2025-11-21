// Тестовый файл для проверки agent-enforcer

// Это вызовет предупреждение no-console
console.log('Тестовое сообщение');

// Это вызовет ошибку no-debugger
debugger;

function example() {
  // Неиспользуемая переменная - вызовет предупреждение
  const unused = 'test';
  
  return 'example';
}

export default example;

