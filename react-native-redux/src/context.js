import React from 'react';

export const ConnectContext = React.createContext({ client: null });

export function withConnectContext(OriginalComponent) {
  const ContextAwareComponent = getContextAwareComponent(
    ConnectContext,
    OriginalComponent,
  );
  return ContextAwareComponent;
}

const getContextAwareComponent = function(context, originalComponent) {
  const Context = context;
  const OriginalComponent = originalComponent;
  const ContextAwareComponent = function(props) {
    return (
      <Context.Consumer>
        {(c) => <OriginalComponent {...c} {...props} />}
      </Context.Consumer>
    );
  };

  ContextAwareComponent.themePath = OriginalComponent.themePath;
  ContextAwareComponent.extraThemePaths = OriginalComponent.extraThemePaths;
  ContextAwareComponent.displayName =
    OriginalComponent.displayName || OriginalComponent.name || 'Component';
  ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace(
    'Base',
    '',
  );

  return ContextAwareComponent;
};