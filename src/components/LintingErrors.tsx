/**
 * Демонстрационный компонент для G3.8 - ошибки линтинга
 * Этот файл специально содержит ошибки ESLint для демонстрации блокировки CI
 */

import React from 'react';

import { useState } from 'react';

const unusedVariable = 'this will cause linting error';

const LintingErrors = () => {
  const unusedLocalVar = 'error';
  
  const handleClick = () => {
    console.log('clicked');
  };
  
  const isTrue = 1 == '1';
  
  const handleSubmit = (event, unusedParam) => {
    event.preventDefault();
  };
  
  var badVariable = 'should use let or const';
  
  function badFunction() {
    return 'bad';
  }
  
  return (
    <div>
      <h1>Component with Linting Errors</h1>
      <button onClick={handleClick}>
        Click me
      </button>
      <form onSubmit={handleSubmit}>
        <input type="text" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export { LintingErrors };
