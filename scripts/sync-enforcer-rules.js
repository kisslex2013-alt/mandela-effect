#!/usr/bin/env node

/**
 * Скрипт для синхронизации правил между .cursor и .enforcer
 * 
 * Извлекает правила из .cursor/rules/*.mdc и обновляет .agent-enforcer.json
 * 
 * Запуск:
 * - Вручную: node scripts/sync-enforcer-rules.js
 * - В Git hook: перед коммитом изменений в .cursor/rules
 * - В CI/CD: для проверки синхронизации
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Правила, которые можно синхронизировать
const RULE_MAPPING = {
  // React правила
  'react-hooks/rules-of-hooks': {
    source: '.cursor/rules/react-patterns.mdc',
    defaultSeverity: 'error',
    description: 'Rules of Hooks - хуки только на верхнем уровне'
  },
  'react-hooks/exhaustive-deps': {
    source: '.cursor/rules/react-patterns.mdc',
    defaultSeverity: 'warning',
    description: 'Dependency arrays обязательны'
  },
  'no-console': {
    source: '.cursor/rules/000-core.mdc',
    defaultSeverity: 'warning',
    description: 'Запрет console.log в production'
  },
  'no-debugger': {
    source: '.cursor/rules/000-core.mdc',
    defaultSeverity: 'error',
    description: 'Запрет debugger в коде'
  },
  'no-unused-vars': {
    source: '.cursor/rules/000-core.mdc',
    defaultSeverity: 'warning',
    description: 'Неиспользуемые переменные'
  },
  'no-undef': {
    source: '.cursor/rules/000-core.mdc',
    defaultSeverity: 'error',
    description: 'Неопределенные переменные'
  }
};

// Читаем правила из .cursor/rules файлов
function extractRulesFromCursor() {
  const rules = {};

  // Читаем основные файлы правил
  const ruleFiles = [
    '.cursor/rules/000-core.mdc',
    '.cursor/rules/react-patterns.mdc',
    '.cursor/rules/zustand-stores.mdc'
  ];

  for (const file of ruleFiles) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) {
      continue;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Ищем упоминания правил
      for (const [ruleName, ruleInfo] of Object.entries(RULE_MAPPING)) {
        if (file === ruleInfo.source) {
          // Проверяем, упоминается ли правило в файле
          const ruleMentioned = content.includes(ruleName) || 
                               content.includes(ruleName.replace(/\//g, ' ')) ||
                               content.includes(ruleInfo.description);

          if (ruleMentioned && !rules[ruleName]) {
            rules[ruleName] = {
              severity: ruleInfo.defaultSeverity,
              source: file,
              description: ruleInfo.description
            };
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Не удалось прочитать ${file}:`, error.message);
    }
  }

  return rules;
}

// Читаем текущую конфигурацию .enforcer
function readEnforcerConfig() {
  const configPath = join(projectRoot, '.agent-enforcer.json');
  
  if (!existsSync(configPath)) {
    console.warn('⚠️  .agent-enforcer.json не найден, создаем новый');
    return {
      rules: {
        js_ts: {},
        python: {},
        general: {}
      },
      ignore: [],
      fileExtensions: {
        js_ts: ['.js', '.jsx', '.ts', '.tsx'],
        python: ['.py']
      },
      maxFileLength: 500,
      maxLinesPerFunction: 100
    };
  }

  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Ошибка при чтении .agent-enforcer.json:', error.message);
    process.exit(1);
  }
}

// Синхронизируем правила
function syncRules(cursorRules, enforcerConfig) {
  const updated = { ...enforcerConfig };
  
  // Инициализируем js_ts правила, если их нет
  if (!updated.rules) {
    updated.rules = {};
  }
  if (!updated.rules.js_ts) {
    updated.rules.js_ts = {};
  }

  let changesCount = 0;

  // Обновляем правила из .cursor
  for (const [ruleName, ruleInfo] of Object.entries(cursorRules)) {
    const currentSeverity = updated.rules.js_ts[ruleName];
    const newSeverity = ruleInfo.severity;

    if (currentSeverity !== newSeverity) {
      updated.rules.js_ts[ruleName] = newSeverity;
      changesCount++;
      console.log(`  ✅ ${ruleName}: ${currentSeverity || 'не задано'} → ${newSeverity}`);
    }
  }

  // Сохраняем обновленную конфигурацию
  if (changesCount > 0) {
    writeFileSync(
      join(projectRoot, '.agent-enforcer.json'),
      JSON.stringify(updated, null, 2) + '\n',
      'utf-8'
    );
    console.log(`\n✅ Обновлено правил: ${changesCount}`);
  } else {
    console.log('\n✅ Правила уже синхронизированы');
  }

  return changesCount;
}

// Основная функция
function main() {
  console.log('🔄 Синхронизация правил между .cursor и .enforcer...\n');

  // Извлекаем правила из .cursor
  console.log('📖 Чтение правил из .cursor/rules...');
  const cursorRules = extractRulesFromCursor();
  console.log(`   Найдено правил: ${Object.keys(cursorRules).length}`);

  // Читаем конфигурацию .enforcer
  console.log('\n📖 Чтение конфигурации .agent-enforcer.json...');
  const enforcerConfig = readEnforcerConfig();

  // Синхронизируем
  console.log('\n🔄 Синхронизация правил...');
  const changesCount = syncRules(cursorRules, enforcerConfig);

  if (changesCount > 0) {
    console.log('\n💡 Конфигурация обновлена. Проверьте изменения перед коммитом.');
  }
}

main();

