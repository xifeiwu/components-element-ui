import PopoverMessage from './src/main';
import popoverOnmouseover from './src/popover-onmouseover';
import Vue from 'vue';

/* istanbul ignore next */
PopoverMessage.install = function(Vue) {
  Vue.directive('popover-onmouseover', popoverOnmouseover);
  Vue.component(PopoverMessage.name, PopoverMessage);
};

export default PopoverMessage;
