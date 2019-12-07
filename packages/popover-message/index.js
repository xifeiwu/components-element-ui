import PopoverMessage from './src/main';
import directivePopoverOnmouseover from './src/popover-onmouseover';
import Vue from 'vue';

/* istanbul ignore next */
PopoverMessage.install = function(Vue) {
  Vue.directive('popover-onmouseover', popoverOnmouseover);
  Vue.component(PopoverMessage.name, PopoverMessage);
};
PopoverMessage.directive = directivePopoverOnmouseover;

export default PopoverMessage;
