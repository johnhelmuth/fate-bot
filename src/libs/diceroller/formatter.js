/**
 * Created by jhelmuth on 7/24/16.
 */

const fate_ladder = require('../fate_ladder');
const _ = require('lodash');

function lookup(lookup_list, offset, value) {
    value += offset;
    if (value < 0) value = 0;
    if (value >= lookup_list.length) value = lookup_list.length - 1;
    return lookup_list[value];
}

/**
 * Format the sum of the dice roll
 */

/** regular dice **/
function describeDiceSum(sum) {
    return sum;
}

/** fudge dice **/
function describeFudgeSum(sum) {
    if (fate_ladder.hasOwnProperty(sum)) {
        console.log('formatFudge() sum: ', sum);
        sum = fate_ladder[sum] + ' (' + (sum < 0 ? '' : '+') + sum + ')'
    }
    return sum;
}

/** either type of dice **/
function formatSum(dr) {
    let fmt = describeDiceSum;
    if (dr.parsed.die_type == 'f') {
        fmt = describeFudgeSum;
    }
    return fmt(dr.sum);
}

/**
 * Format the individual dice in the roll
 */

/** regular dice **/
function describeDiceList(rolls) {
    return rolls.join(', ');
}

/** one fudge dice **/
function describeAFudgeDice(val) {
    return lookup(fudge_map, 1, val);
}

/** several fudge dice **/
function describeFudgeDiceList(rolls) {
    return rolls.map(describeAFudgeDice).join(' ');
}

/** either type of dice **/
function formatRolls(dr) {
  let fmt = describeDiceList;
    if (dr.parsed.die_type == 'f') {
        fmt = describeFudgeDiceList;
    }
    return fmt(dr.rolls);
}

/** Format the bonus (either type of dice **/
function formatBonus(bonus) {
    if (bonus) {
        return (bonus < 0 ? '-' : '+') + Math.abs(bonus);
    }
    return '';
}

/**
 * Format the entire roll as a string
 */

/** regular dice **/
function formatDice(rolls, sum, bonus, description) {
  const dice_list = describeDiceList(rolls);
  const bonus_description = formatBonus(bonus);
  const dice_sum = describeDiceSum(sum).toString();
  let formatted_roll = `${dice_list} ${bonus_description} = *${dice_sum.trim()}`;
  if (! _.isEmpty(description.trim())) {
    formatted_roll += ` ${description.trim()}`;
  }
  formatted_roll += '*';
  return formatted_roll;
}

/** fudge dice **/
function formatFudge(rolls, sum, bonus, description) {
    //  rolled [-] [ ] [-] [+]  @+3 = Fair (+2)
  const dice_list = describeFudgeDiceList(rolls);
  const bonus_description = formatBonus(bonus).toString();
  const dice_sum = describeFudgeSum(sum).toString();
  let formatted_roll = `${dice_list} ${bonus_description} = *${dice_sum.trim()}`;
  if (! _.isEmpty(description.trim())) {
    formatted_roll += ` ${description.trim()}`;
  }
  formatted_roll += '*';
  return formatted_roll;
}

/** either type of dice **/
function format(dr) {
  let fmt = formatDice;
    if (dr.parsed.die_type == 'f') {
        fmt = formatFudge;
    }
    return fmt(dr.rolls, dr.sum, dr.parsed.bonus, dr.parsed.description);
}

const default_fudge_map = ["[-]", "[ ]", "[+]"];
let fudge_map = default_fudge_map;
function setFudgeMap(new_map) {
    console.log('setFudgeMap() new_map: ', new_map);
    if (_.isArray(new_map) && new_map.length == 3) {
        console.log('setFudgeMap() setting fudge_map');
        fudge_map = new_map;
    }
}
function resetFudgeMap() {
    fudge_map = default_fudge_map;
}

module.exports = {

    describeFudgeDiceList: describeFudgeDiceList,
    describeDiceList: describeDiceList,

    describeFudgeSum: describeFudgeSum,
    describeDiceSum: describeDiceSum,

    formatFudge: formatFudge,
    formatDice: formatDice,

    format: format,
    formatBonus: formatBonus,
    formatRolls: formatRolls,
    formatSum: formatSum,

    setFudgeMap: setFudgeMap,
    resetFudgeMap: resetFudgeMap
};
