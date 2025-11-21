#!/usr/bin/env node

/**
 * Скрипт для автоматического создания задач в Beads при обнаружении проблем качества кода
 * Используется для интеграции .enforcer + .beads
 * 
 * Запуск:
 * - Вручную: node scripts/enforcer-to-beads.js
 * - В Git hook: после проверки качества
 * - В cron: раз в день для отслеживания технического долга
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Проверяем наличие необходимых инструментов
function checkDependencies() {
  const checks = {
    'agent-enforcer': false,
    'bd': false
  };

  try {
    execSync('node scripts/agent-enforcer.js --version', { stdio: 'pipe' });
    checks['agent-enforcer'] = true;
  } catch {
    console.warn('⚠️  agent-enforcer не найден');
  }

  try {
    execSync('bd --version', { stdio: 'pipe' });
    checks['bd'] = true;
  } catch {
    console.warn('⚠️  beads (bd) не установлен');
  }

  return checks;
}

// Запускаем проверку качества и получаем результаты
function runQualityCheck() {
  try {
    const output = execSync('npm run quality:check:verbose', {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    return { success: true, output };
  } catch (error) {
    // agent-enforcer возвращает ненулевой код при обнаружении проблем
    const output = error.stdout || error.message;
    return { success: false, output };
  }
}

// Парсим результаты проверки
function parseIssues(output) {
  const issues = [];
  const lines = output.split('\n');

  let currentFile = null;
  let currentLine = null;
  let currentRule = null;
  let currentSeverity = null;

  for (const line of lines) {
    // Определяем файл
    const fileMatch = line.match(/^(.+\.(js|jsx|ts|tsx)):/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    // Определяем строку и правило
    const lineMatch = line.match(/^\s+(\d+):(\d+)\s+(error|warning)\s+(.+)/);
    if (lineMatch) {
      currentLine = lineMatch[1];
      currentSeverity = lineMatch[3];
      currentRule = lineMatch[4].trim();
      
      if (currentFile && currentRule) {
        issues.push({
          file: currentFile,
          line: currentLine,
          rule: currentRule,
          severity: currentSeverity
        });
      }
    }
  }

  return issues;
}

// Группируем проблемы по файлам и правилам
function groupIssues(issues) {
  const grouped = {};

  for (const issue of issues) {
    const key = `${issue.file}:${issue.rule}`;
    if (!grouped[key]) {
      grouped[key] = {
        file: issue.file,
        rule: issue.rule,
        severity: issue.severity,
        count: 0,
        lines: []
      };
    }
    grouped[key].count++;
    grouped[key].lines.push(issue.line);
  }

  return Object.values(grouped);
}

// Создаем задачи в Beads
function createBeadsTasks(groupedIssues) {
  const createdTasks = [];

  for (const group of groupedIssues) {
    const priority = group.severity === 'error' ? 0 : 2; // 0 = критично, 2 = средний
    const taskType = group.severity === 'error' ? 'bug' : 'task';
    
    const title = `Исправить ${group.rule} в ${group.file}`;
    const description = `Найдено ${group.count} нарушений правила "${group.rule}" в файле ${group.file}.\nСтроки: ${group.lines.join(', ')}`;

    try {
      // Создаем задачу
      const createOutput = execSync(
        `bd create "${title}" -t ${taskType} -p ${priority} --json`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );

      const task = JSON.parse(createOutput.trim());
      const taskId = task.id;

      // Добавляем описание через update (если поддерживается)
      try {
        execSync(
          `bd update ${taskId} --description "${description}"`,
          { stdio: 'pipe' }
        );
      } catch {
        // Если update не поддерживает description, пропускаем
      }

      createdTasks.push({
        id: taskId,
        title,
        severity: group.severity,
        file: group.file
      });

      console.log(`✅ Создана задача: ${taskId} - ${title} (${group.severity})`);
    } catch (error) {
      console.error(`❌ Ошибка при создании задачи для ${group.file}:`, error.message);
    }
  }

  return createdTasks;
}

// Проверяем, не созданы ли уже задачи для этих проблем
function checkExistingTasks(groupedIssues) {
  // TODO: Реализовать проверку существующих задач через bd list
  // Пока возвращаем все проблемы как новые
  return groupedIssues;
}

// Основная функция
function main() {
  console.log('🔍 Запуск проверки качества кода и создания задач в Beads...\n');

  // Проверяем зависимости
  const deps = checkDependencies();
  if (!deps['agent-enforcer']) {
    console.error('❌ agent-enforcer не найден. Убедитесь, что scripts/agent-enforcer.js существует');
    process.exit(1);
  }
  if (!deps['bd']) {
    console.error('❌ beads (bd) не установлен. Установите: https://github.com/steveyegge/beads');
    process.exit(1);
  }

  // Запускаем проверку
  console.log('📊 Запуск проверки качества...');
  const checkResult = runQualityCheck();

  if (checkResult.success && !checkResult.output.includes('error') && !checkResult.output.includes('warning')) {
    console.log('✅ Проблем качества не обнаружено');
    process.exit(0);
  }

  // Парсим проблемы
  console.log('🔍 Анализ результатов...');
  const issues = parseIssues(checkResult.output);

  if (issues.length === 0) {
    console.log('✅ Проблем не найдено (или формат вывода изменился)');
    process.exit(0);
  }

  console.log(`📋 Найдено ${issues.length} проблем\n`);

  // Группируем проблемы
  const grouped = groupIssues(issues);
  console.log(`📦 Сгруппировано в ${grouped.length} задач\n`);

  // Проверяем существующие задачи
  const newIssues = checkExistingTasks(grouped);

  if (newIssues.length === 0) {
    console.log('✅ Все проблемы уже отслеживаются в Beads');
    process.exit(0);
  }

  // Создаем задачи в Beads
  console.log('📝 Создание задач в Beads...\n');
  const createdTasks = createBeadsTasks(newIssues);

  // Итоговая статистика
  console.log(`\n✅ Создано задач: ${createdTasks.length}`);
  const errors = createdTasks.filter(t => t.severity === 'error').length;
  const warnings = createdTasks.filter(t => t.severity === 'warning').length;
  console.log(`   - Критичных (error): ${errors}`);
  console.log(`   - Предупреждений (warning): ${warnings}`);

  // Показываем список созданных задач
  if (createdTasks.length > 0) {
    console.log('\n📋 Созданные задачи:');
    for (const task of createdTasks) {
      console.log(`   - ${task.id}: ${task.title}`);
    }
    console.log('\n💡 Просмотр задач: bd list');
    console.log('💡 Готовые к работе: bd ready');
  }
}

main();

